import $ from 'jquery';
import 'trtc-sdk';
import RoomOperation from "../../room-operation/RoomOperation";
import UploadFile from '../uploadFile/UploadFile';
import PreImgDialog from "../../video-dialog/PreImgDialog";


export default class RTCManger {

    static getInstance(opts = {}) {
        if (!RTCManger.instance || !RTCManger.instance instanceof this) {
            RTCManger.instance = new this;
            RTCManger.instance.RTC = null;
            RTCManger.instance._loginInfo = {};
            RTCManger.instance._options = opts;
        }
        return RTCManger.instance;
    }

    init(data, cb) {
        RTCManger.instance._loginInfo.userId = data.info.userId;
        RTCManger.instance.RTC = new WebRTCAPI({
            sdkAppId: data.info.sdkAppId,
            userId: data.info.userId,
            userSig: data.info.userSign,
            accountType: window.parseInt(data.info.accountType),
            closeLocalMedia: true,
            debug: {
                log: true,
                vconsole: false,
                uploadLog: true,
            },
        }, (result) => {
            console.log('RTC login: ', result);
            const mRoomId = data.mRoomId;
            const mUserToken = data.mUserToken;
            this._checkRTC({mRoomId: mRoomId, mUserToken: mUserToken}, cb);
        }, (error) => {
            cb && cb({code: 500, msg: error})
        });
        this.initIM(data.info);
    };

    _checkRTC(params, cb) {
        RTCManger.instance.RTC.detectRTC({ screenshare: false }, (info) => {
            if (!info.support) {
                cb && cb({code: 500, msg: '设备暂不支持视频音频通话'})
            } else {
               this._enterRoom(params, cb);
            }
        })
    }

    _enterRoom(data, cb) {
        RTCManger.instance.RTC.enterRoom({
            roomid: window.parseInt(data.mRoomId),
            role: 'user',
            privateMapKey: data.mUserToken,
        }, () => {
            cb && cb({code: 200, msg: '进入房间成功'});
            this._addListenet();
        }, (err) => {
            cb && cb({code: 500, msg: '进入房间失败'});
        })
    }

    getLocalStream() {
        RTCManger.instance.RTC.getLocalStream({}, (data) => {
            const stream = data.stream;
            RTCManger.instance.RTC.startRTC({
                stream: stream,
                role: 'user'
            }, (data) => {
                console.log("start RTC success: ", data);
            }, (err) => {
                console.log("start RTC err: ", err);
            })
        }, (err) => {
           console.log("get local stream err: ", err);
        });
    }


    destroy() {
        RTCManger.instance.RTC.quit();
        webim.logout();
        RTCManger.instance = null;
    }

    captureVideo() {
        const video = document.getElementById('txtVideoCallCneterLocalVideo');
        const canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        const width = video.videoWidth;
        const height = video.videoHeight;
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(video, 0, 0, width, height);
        canvas.toBlob((blob) => {
            UploadFile.getInstance(RTCManger.instance_options).upload(blob, (img) => {
                PreImgDialog.getInstance().addImg(img.url);
            });
        });


    }

    _addListenet() {
        RTCManger.instance.RTC.on('onLocalStreamAdd', (data) => {
            if( data && data.stream){
                $('#txtVideoCallCneterLocalVideo').prop('srcObject', data.stream);
                // $('#txtVideoCallCneterLocalVideo').on('click', () => {
                //     this.captureVideo();
                // });
            }
        });
        RTCManger.instance.RTC.on('onRemoteStreamUpdate', (data) => {
            console.log("Remote Stream: ", data);
            if( data && data.stream){
                $('#txtVideoCallCneterVideo').prop('srcObject', data.stream);
                RoomOperation.getInstance(RTCManger.instance._options).startVideo();
            }
        });
        RTCManger.instance.RTC.on('onRemoteStreamRemove', (data) => {
            console.log('onRemoteStreamRemove: ', data);
            $('#txtVideoCallCneterVideo').prop('srcObject', null);
            RoomOperation.getInstance(RTCManger.instance._options).onStreamEnded();
        });
        RTCManger.instance.RTC.on('onWebSocketClose', (data) => {
            console.log('onWebSocketClose: ', data);
        });
        RTCManger.instance.RTC.on('onRelayTimeout', (data) => {
            console.log('onRelayTimeout: ', data);
        });
        RTCManger.instance.RTC.on('onKickout', (data) => {
            console.log('onKickout: ', data);
        });
    }

    stopRTC() {
        RTCManger.instance.RTC.stopRTC({}, () => {
            $('#txtVideoCallCneterLocalVideo').prop('srcObject', null);
        }, () => {
            $('#txtVideoCallCneterLocalVideo').prop('srcObject', null);
        });
    }

    initIM(response) {
        const loginInfo = {
            sdkAppID: response.sdkAppId,
            appIDAt3rd: response.sdkAppId,
            identifier: response.userId,
            identifierNick: '客服',
            accountType: response.accountType,
            userSig: response.userSign
        };
        console.log("IM init: ", loginInfo);
        webim.login(loginInfo, {
            onConnNotify: this.onConnNotify,
            jsonpCallback: this.jsonpCallback,
            onMsgNotify: this.onMsgNotify,
            onBigGroupMsgNotify: this.onBigGroupMsgNotify,
            onGroupSystemNotifys: this.onGroupSystemNotifys,
            onGroupInfoChangeNotify: this.onGroupInfoChangeNotify,
            onFriendSystemNotifys: this.onFriendSystemNotifys,
            onProfileSystemNotifys: this.onProfileSystemNotifys,
            onKickedEventCall: this.onKickedEventCall,
            onC2cEventNotifys: this.onC2cEventNotifys
        }, {isLogOn: true}, (resp) => {
            console.log("IM init success: ", resp);
        }, (err) => {
            console.log("IM init err: ", err);
        });
    }

    /**
     * 监听链接状态回调变化事件
     * @param resp
     */
    onConnNotify(resp) {
        switch (resp.ErrorCode) {
            case webim.CONNECTION_STATUS.ON:
                console.warn('建立链接成功： ', resp.ErrorInfo);
                break;
            case webim.CONNECTION_STATUS.OFF:
                console.warn('连接已断开，无法收到新消息，请检查下您的网路是否正常：', resp.ErrorInfo);
                break;
            case webim.CONNECTION_STATUS.RECONNECT:
                console.warn('连接状态回复正常：', resp.ErrorInfo);
                break;
            default:
                console.warn('位置连接状态：', resp.ErrorInfo);
                break;
        }
    }

    /**
     * IE9(含)以下浏览器用到jsonp回调函数
     * @param rspData
     */
    jsonpCallback(rspData) {
        webim.setJsonpLastRspData(rspData);
    }

    /**
     * 监听新消息
     * @param newMsgList
     */
    onMsgNotify(newMsgList) {
        let sess, newMsg, selToID;
        const sessMap = webim.MsgStore.sessMap();
        for (let j in newMsgList) {
            newMsg = newMsgList[j];
            if (newMsg.getSession().id == selToID) {
                // TODO: 新消息
            }
        }
    }

    onBigGroupMsgNotify() {

    }

    onGroupSystemNotifys() {

    }

    onGroupInfoChangeNotify() {

    }

    onFriendSystemNotifys() {

    }

    onProfileSystemNotifys() {

    }

    onKickedEventCall() {

    }

    onC2cEventNotifys() {

    }

    sendMsg(message, sendId, cb) {
        const msgtosend = '';
        const sendType = webim.SESSION_TYPE.C2C; //会话类型
        const id = sendId; // 对方id
        const name = id; // 对方昵称
        const icon = ''; //对方头像
        const time = Math.round(new Date().getTime() / 1000); // 会话最新时间戳
        const seq = -1; //消息序列号
        const isSend = false; //是否给自己发送
        const random = Math.round(Math.random() * 4294967296); // 消息随机数，用于去重
        const msgTime = Math.round(new Date().getTime() / 1000); // 消息时间戳
        const subType = webim.C2C_MSG_SUB_TYPE.COMMON;
        const selSess = new webim.Session(sendType, id, name, icon, time);
        const msg = new webim.Msg(selSess, isSend, seq, random, msgTime, RTCManger.instance._loginInfo.userId, subType, '客服');

        const text_obj = new webim.Msg.Elem.Text(msgtosend);
        msg.addText(text_obj);
        webim.sendMsg(msg, (resp) => {
            cb && cb({code: 200, msg: resp});
        }, (err) => {
            cb && cb({code: 500, msg: err});
        });
    }

    uploadPic(file, cb) {
        const businessType = webim.UPLOAD_PIC_BUSSINESS_TYPE.C2C_MSG;
        const selToID = RTCManger.instance._loginInfo.userId;
        const identifier = RTCManger.instance._loginInfo.userId;
        const opt = {
            'file': file, //图片对象
            'From_Account': identifier, //发送者帐号
            'To_Account': selToID, //接收者
            'businessType': businessType//业务类型
        };
        webim.uploadPic(opt, (resp) => {
            //上传图片成功
            console.log('上传图片成功：', resp);
            this.sendPic(resp, selToID, cb);
        }, (err) => {
            console.log('上传图片失败：', err);
            cb && cb({code: 500, msg: err});
        })
    }

    sendPic(images, selToID) {
        const sendType = webim.SESSION_TYPE.C2C; //会话类型
        const id = selToID; // 对方id
        const name = id; // 对方昵称
        const icon = ''; //对方头像
        const time = Math.round(new Date().getTime() / 1000); // 会话最新时间戳
        const selSess = new webim.Session(sendType, id, name, icon, time);
        const msg = new webim.Msg(selSess, true);
        const images_obj = new webim.Msg.Elem.Images(images.File_UUID);
        for (let i in images.URL_INFO) {
            const img = images.URL_INFO[i];
            let newImg;
            let type;
            switch (img.PIC_TYPE) {
                case 1: // 原图
                    type = 1;
                    break;
                case 2: // 小图
                    type = 3;
                    break;
                case 4: // 大图
                    type = 2;
                    break;
            }
            newImg = new webim.Msg.Elem.Images.Image(type, img.PIC_Size, img.PIC_Width, img.PIC_Height, img.DownUrl);
            images_obj.addImage(newImg);
        }
        msg.addImage(images_obj);
        webim.sendMsg(msg, (resp) => {
            console.log('发送图片成功：', resp);
            cb && cb({code: 200, msg: resp});
        }, (err) => {
            console.log('发送图片失败：', err);
            cb && cb({code: 500, msg: err});
        });
    }

}