import io from 'socket.io-client';
import onfire from 'onfire.js';
import AnswerCallManger from '../../answer-call/AnswerCallManger';
import RoomOperation from "../../room-operation/RoomOperation";
import VideoDialog from "../../video-dialog/VideoDialog";
import PreImgDialog from "../../video-dialog/PreImgDialog";

export default class SocketManger {
    static getInstance(opts = {}) {
        if (!SocketManger.instance || !SocketManger.instance instanceof this) {
            SocketManger.instance = new this;
            SocketManger.instance._options = opts;
        }
        return SocketManger.instance;
    }

    init(cb) {
        if (!this.socket) {
            this.reconnectTimes = 0;
            this.socket = null;
            this.isConnect = false;
            this.socket = io(`${SocketManger.instance._options.socketUrl}?client=agent&token=${SocketManger.instance._options.token}&id=${SocketManger.instance._options.id}`);
            this._addListener(cb);
        }
    }

    _heartbeat() {
        this.socket.on('ping', (msg) => {
            console.log('Socket ping: ', msg);
        });
        this.socket.on('pong', (msg) => {
            console.log('Socket pong: ', msg);
        });
    }

    _addListener(cb) {
        this.socket.on('connect', () => {
            console.log('Socket: ', 'socket connect success');
            cb({code: 200, msg: 'socket connection success'});
            this.isConnect = true;
        });
        this.socket.on('disconnect', () => {
            console.log('Socket: ', 'socket disconnect');
            this.isConnect = false;
        });
        this.socket.on('connect_failed', () => {
            console.log('Socket: ', 'socket connect failed');
            cb({code: 500, msg: 'socket connection failed'});
            this.isConnect = false;
        });
        this.socket.on('error', () => {
            console.log('Socket: ', 'socket reconnect error');
            cb({code: 500, msg: 'socket connection failed'});
            this.isConnect = false;
        });
        this.socket.on('reconnect_failed', () => {
            console.log('Socket: ', 'socket reconnect failed');
            cb({code: 500, msg: 'socket connection failed'});
            this.isConnect = false;
        });
        this.socket.on('reconnect', () => {
            console.log('Socket: ', 'socket reconnect success');
            cb({code: 200, msg: 'socket connection success'});
            this.isConnect = true;
        });
        this.socket.on('reconnecting', () => {
            console.log('Socket: ', 'socket reconnecting');
            if (this.reconnectTimes >= 5) {
                this.reconnectTimes = 0;
                this.socket.close();
                this.isConnect = false;
                cb({code: 500, msg: 'socket connection failed'});
            } else {
                this.reconnectTimes += 1;
            }
        });
        this._heartbeat();
        this._onCallIncoming();
        this._onCustomerImg();
        this._onTalkIncoming();
        this._onCallFinish();
        this._onMixedSuccess();
        this._onCallStatus();
    }

    _removeListener() {
        const listeners = [
          'SA_Call_Incoming',
          'SA_Customer_Img',
          'SA_Talk_Incoming',
          'SA_Call_Finish',
          'SA_Mixed_Result',
          'SA_Call_Status',
        ];
        for (let listener in listeners) {
            if (listener != undefined) {
                this.socket.removeAllListeners(listener);
            }
        }
    }

    /**
     * 呼叫请求
     * @private
     */
    _onCallIncoming() {
        this.socket.on('SA_Call_Incoming', (params) => {
            console.log('SA_Call_Incoming', params);
            VideoDialog.getInstance().show();
            AnswerCallManger.getInstance(SocketManger.instance._options).callComing(params);
        });
    }

    /**
     * 客户上传图片
     * @private
     */
    _onCustomerImg() {
        this.socket.on('SA_Customer_Img', (params) => {
            console.log('SA_Customer_Img', params);
            PreImgDialog.getInstance().addImg(params.imgUrl);
        });
    }

    /**
     * 客户通话
     * @private
     */
    _onTalkIncoming() {
        this.socket.on('SA_Talk_Incoming', (params) => {
            console.log('SA_Talk_Incoming', params);
            RoomOperation.getInstance(SocketManger.instance._options).requestTalk(params);
        });
    }

    /**
     * 结束会话
     * @private
     */
    _onCallFinish() {
        this.socket.on('SA_Call_Finish', (params) => {
            console.log('SA_Call_Finish', params);
            AnswerCallManger.getInstance(SocketManger.instance._options).callCancel(params);
        });
    }

    /**
     * 混流成功
     * @private
     */
    _onMixedSuccess() {
        this.socket.on('SA_Mixed_Result', (params) => {
            console.log('SA_Mixed_Result', params);
            if (params.result) {
                AnswerCallManger.getInstance(SocketManger.instance._options).mixedSuccess(params);
            }
        });
    }

    /**
     * 混流成功
     * @private
     */
    _onCallStatus() {
        this.socket.on('SA_Call_Status', (calls) => {
            console.log('SA_Call_Status', calls);
            calls.forEach((call) => {
               if (call.status === 'wait_answer') {
                   AnswerCallManger.getInstance(SocketManger.instance._options).callComing(call);
               } else if (call.status === 'answered') {
                   AnswerCallManger.getInstance(SocketManger.instance._options).mixedSuccess(call);
               }
            });
            RoomOperation.getInstance(SocketManger.instance._options).synchronizeRoomInfo(calls);
        });
    }

    disConnectSocket() {
        if (this.socket) {
            this._removeListener();
            this.socket.close();
            this.socket = null;
        }
    }
}