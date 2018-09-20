import $ from 'jquery';
import onfire from 'onfire.js';
import notConnected from '../templates/not-connected/NotConnected';
// import GetRoomInfo from '../common/room-info/GetRoomInfo';
import Customer from '../templates/customer/Customer';
import Participant from '../participant/Participant';
import {fetchPost} from "../common/http/Fetch";
import AnswerCallManger from "../answer-call/AnswerCallManger";
import MinDialogManger from "../min-dialog/MinDialogManger";
import RTCManger from "../common/trtc/RTCManger";
import UploadFile from '../common/uploadFile/UploadFile';
import PreImgDialog from "../video-dialog/PreImgDialog";

export default class RoomOperation {
    static getInstance(opts = {}) {
        if (!RoomOperation.instance || !RoomOperation.instance instanceof this) {
            RoomOperation.instance = new this;
            RoomOperation.instance._options = opts;
            RoomOperation.instance._videoTime = null;
            RoomOperation.instance._talkCutdown = null;
            RoomOperation.instance._customers = new Map();
            RoomOperation.instance._talkAndActive = new Map();
            UploadFile.getInstance().init(opts);
        }
        return RoomOperation.instance;
    }

    render(call) {
        if (!call) {
            RoomOperation.instance._customers.clear();
            this._renderOperation();
            return;
        }
        if (RoomOperation.instance._customers.get(call.sid)) return;
        const customer = {
            showName: call.showName === '' ? call.cid : call.showName,
            extra: call.extra,
            isWaiting: true,
            isRequestTalking: false,
            isTalking: false,
            opClassName: 'txt-video-room-mute-btn-close',
            sid: call.sid,
            cid: call.cid,
        };
        RoomOperation.instance._customers.set(customer.sid, customer);
        this._renderOperation();
    }

    startVideo() {
        const customers = [...RoomOperation.instance._customers.values()];
        customers.forEach((item) => {
            item.isWaiting = false;
            RoomOperation.instance._customers.set(item.sid, item);
            $('#txtVideoCallCenterOperation').html(Customer({customers: [...RoomOperation.instance._customers.values()]}));
            this._addHandle();
            this._startTimer();
        });
    }

    _renderOperation() {
        this._calculationStatus();
    }

    _calculationStatus() {
        console.log('Calculation Status: ', RoomOperation.instance._customers.size);
        const customers = [...RoomOperation.instance._customers.values()];
        if (customers.length === 0) {
            MinDialogManger.getInstance().setNum({num: 0, msg: '当前暂无视屏...'});
            Participant.getInstance().clearParticipants();
            $('#txtVideoCallCenterOperation').html(notConnected({}));
            return;
        }
        MinDialogManger.getInstance().setNum({num: customers.length, msg: '视频通话中...'});
        customers.forEach((item) => {
            Participant.getInstance().addParticipant(item, item.cid, item.pid);
            if (customers.length === 1) {
                item.styleName = 'txt-video-call-center-customer-content-100';
            } else if (customers.length > 1) {
                if (item.isActive) {
                    item.styleName = item.isActive ? 'txt-video-call-center-customer-content-50 txt-call-active' : 'txt-video-call-center-customer-content-50';
                } else {
                    item.styleName = 'txt-video-call-center-customer-content-50';
                }
            }
            RoomOperation.instance._customers.set(item.sid, item);
            $('#txtVideoCallCenterOperation').html(Customer({customers: [...RoomOperation.instance._customers.values()]}));
            this._addHandle();
        });
    }

    _addHandle() {
        const customers = [...RoomOperation.instance._customers.values()];
        for (let index in customers) {
            $(`#customers${customers[index].sid}`).bind('click', {index: customers[index].sid}, (event) => {
                console.log('Array index: ', event.data.index);
                this._changeActiveWindow(event.data.index);
                event.stopPropagation();
            });
            $(`#txtVideoCallCenterTalk${customers[index].sid}`).bind('click', {index: customers[index].sid}, (event) => {
                if ($(`#txtVideoCallCenterTalk${customers[index].sid}`).hasClass('txt-video-room-mute-btn-open')) return;
                this._talk(event.target.dataset);
                event.stopPropagation();
            });
            $(`#txtVideoCallCenterEndCall${customers[index].sid}`).bind('click', {index: customers[index].sid}, (event) => {
                this._endCall(event.target.dataset, false);
                event.stopPropagation();
            });
            $(`#txtVideoCallCenterRequestTalk${customers[index].sid}`).bind('click', {index: customers[index].sid}, (event) => {
                if ($(`#txtVideoCallCenterTalk${customers[index].sid}`).hasClass('txt-video-room-mute-btn-open')) return;
                this._talk(event.target.dataset);
                event.stopPropagation();
            });
            $(`#txtVideoCallCenterCapture${customers[index].sid}`).bind('click', {index: customers[index].sid}, (event) => {
                this.captureVideo(event.target.dataset.sid);
                event.stopPropagation();
            });
        }
    }

    captureVideo(sid) {
        const video = document.getElementById('txtVideoCallCneterVideo');
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
                this.uploadImg(img.url, sid);
            });
        });
    }

    async uploadImg(img, sid) {
        const result = await fetchPost(`${RoomOperation.instance._options.serverUrl}/agent/uploadImg`, {
            aid: RoomOperation.instance._options.id,
            sid: sid,
            imgUrl: img,
        }, RoomOperation.instance._options.token);
    }

    _changeActiveWindow(sid) {
        for (let key of RoomOperation.instance._customers.keys()) {
            const c = RoomOperation.instance._customers.get(key);
            if (key === sid) {
                c.isActive = true;
                onfire.fire('onCurrentCall', c);
            } else {
                c.isActive = false;
            }
            RoomOperation.instance._customers.set(key, c);
        }
        this._calculationStatus();
    }

    async _talk(call) {
        const result = await fetchPost(`${RoomOperation.instance._options.serverUrl}/agent/talk`, {
            aid: RoomOperation.instance._options.id,
            sid: call.sid,
        }, RoomOperation.instance._options.token);
        if (result && result.statusCode === 200) {
            this._resetTalk();
            const c = RoomOperation.instance._customers.get(call.sid);
            if (c) {
                c.isTalking = true;
                c.isRequestTalking = false;
                clearInterval(c.timing);
                c.timing = null;
                c.opClassName = 'txt-video-room-mute-btn-open';
                RoomOperation.instance._customers.set(c.sid, c);
                this._changeActiveWindow(c.sid);
                this._recordTalk(c.sid);
                $('#txtVideoCallingName').text(`正在与${c.showName}对讲中`);
            }
        }
    }

    _resetTalk() {
        const talkingSid = RoomOperation.instance._talkAndActive.get('talking');
        const c = RoomOperation.instance._customers.get(talkingSid);
        if (c) {
            c.isTalking = false;
            c.opClassName = 'txt-video-room-mute-btn-close';
            RoomOperation.instance._customers.set(c.sid, c);
        }
    }

    async _endCall(call, abnormal) {
        const result = await fetchPost(`${RoomOperation.instance._options.serverUrl}/agent/hangOff`, {
            aid: RoomOperation.instance._options.id,
            sid: call.sid,
            abnormal: abnormal,
        }, RoomOperation.instance._options.token);
        if (result && result.statusCode === 200) {
            this.callEnd(call);
        }
    }

    callEnd(call) {
        const c = RoomOperation.instance._customers.get(call.sid);
        if (c) {
            $('#txtVideoCallCneterVideo').prop('srcObject', null);
            this._stopVideoTimer();
            $('#txtVideoCallingName').text('');
            onfire.fire('onCallEnd', call);
            RTCManger.getInstance(RoomOperation.instance._options).stopRTC();
            Participant.getInstance().removeParticipant(call.cid);
            RoomOperation.instance._customers.delete(call.sid);
            if (RoomOperation.instance._customers.size === 0) {
                onfire.fire('onCallEndAll', '');
                AnswerCallManger.getInstance(RoomOperation.instance._options).clearRecordCallMap();
            }
            this._calculationStatus();
        }
    }

    requestTalk(call) {
        const c = RoomOperation.instance._customers.get(call.sid);
        if (c) {
            c.isRequestTalking = true;
            c.cutDownTime = '(0s) 接受';
            RoomOperation.instance._customers.set(c.sid, c);
            this._calculationStatus();
            if (!RoomOperation.instance._talkCutdown) {
                let time = 60;
                RoomOperation.instance._talkCutdown = setInterval(() => {
                    if ($(`#txtVideoCallCenterRequestTalk${c.sid}`)[0]) {
                        c.cutDownTime = `(${time}s) 接受`;
                        RoomOperation.instance._customers.set(c.sid, c);
                        $(`#txtVideoCallCenterRequestTalk${c.sid}`).text(`(${time}s) 接受`)
                    }
                    if (time === 0) {
                        if (RoomOperation.instance._talkCutdown) {
                            clearInterval(RoomOperation.instance._talkCutdown);
                            RoomOperation.instance._talkCutdown = null;
                            c.isRequestTalking = false;
                            RoomOperation.instance._customers.set(c.sid, c);
                            this._calculationStatus();
                            return;
                        }
                    }
                    time -= 1;
                }, 1000);
            }
        }
    }

    _startTimer() {
        const customers = [...RoomOperation.instance._customers.values()];
        customers.forEach((customer) => {
            let minute = 0;
            let second = 0;
            RoomOperation.instance._videoTime = setInterval(() => {
                if (second >= 60) {
                    second = 0;
                    minute += 1;
                }
                const time = `${minute >= 10 ? minute : '0' + minute}:${second >= 10 ? second : '0' + second}`;
                if ($(`#txtVideoCallCenterTimer${customer.sid}`)[0]) {
                    $(`#txtVideoCallCenterTimer${customer.sid}`).text(`${time}`);
                    customer.wTimer = time;
                    RoomOperation.instance._customers.set(customer.sid, customer);
                }
                second += 1;
            }, 1000);
        });
    }

    _stopVideoTimer() {
        if (RoomOperation.instance._videoTime) {
            clearInterval(RoomOperation.instance._videoTime);
            RoomOperation.instance._videoTime = null;
        }
        if (RoomOperation.instance._talkCutdown) {
            clearInterval(RoomOperation.instance._talkCutdown);
            RoomOperation.instance._talkCutdown = null;
        }
    }

    _recordTalk(sid) {
        RoomOperation.instance._talkAndActive.set('talking', sid);
    }

    destroy() {
        RoomOperation.instance._options = null;
        RoomOperation.instance._customers = null;
        RoomOperation.instance._talkAndActive = null;
        RoomOperation.instance = null;
    }

    onStreamEnded() {
        const customers = [...RoomOperation.instance._customers.values()];
        customers.forEach((customer) => {
            this._endCall(customer, true);
        });
        this._calculationStatus();
    }

    synchronizeRoomInfo(customers = []) {
        const calls = [...RoomOperation.instance._customers.values()];
        let result = [];
        if (customers.length !== calls.length) {
            for (let i = 0; i < calls.length; i++) {
                let call = calls[i];
                let flag = false;
                for (let j = 0; j < customers.length; j++ ) {
                    let customer = customers[j];
                    if (call.sid === customer.sid) {
                        flag = true;
                        break;
                    }
                }
                if (!flag) {
                    result.push(call);
                }
            }
            console.log('Synchronize Room Info: ', result);
            this._exceptionEndCall(result);
        } else if (customers.length === 0) {
            RoomOperation.instance._customers.clear();
            this._calculationStatus();
        }
    }

    _exceptionEndCall(calls = []) {
        calls.forEach((call) => {
            RoomOperation.instance._customers.delete(call.sid);
        });
        this._calculationStatus();
    }

}