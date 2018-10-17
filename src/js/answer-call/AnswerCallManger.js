import $ from 'jquery';
import onfire from 'onfire.js';
import {fetchPost} from '../common/http/Fetch';
import answerFooter from '../templates/answer-call/AnswerCall';
import Timer from '../common/timer/Timer';
import RoomOperation from "../room-operation/RoomOperation";
import VideoDialog from "../video-dialog/VideoDialog";
import MinDialogManger from "../min-dialog/MinDialogManger";
import RTCManger from '../common/trtc/RTCManger';

export default class AnswerCallManger {
    static getInstance(opts = {}) {
        if (!AnswerCallManger.instance || !AnswerCallManger.instance instanceof this) {
            AnswerCallManger.instance = new this;
            AnswerCallManger.instance._options = opts;
            AnswerCallManger.instance._callList = [];
            AnswerCallManger.instance._hasAnsweredCallMap = new Map();
            AnswerCallManger.instance._callType = {
                "web": "txt-video-room-call-type-web",
                "android": "txt-video-room-call-type-android",
                "iphone": "txt-video-room-call-type-iphone",
                "wx": "txt-video-room-call-type-wx",
            };
            AnswerCallManger.instance._timer = null;
            AnswerCallManger.instance.sendToId = null;
        }
        return AnswerCallManger.instance;
    }

    async _answerCall(call) {
        console.log('Answer Call: ', call);
        const result = await fetchPost(`${AnswerCallManger.instance._options.serverUrl}/agent/reply`, {
            aid: AnswerCallManger.instance._options.id,
            sid: call.sid,
            accept: true
        }, AnswerCallManger.instance._options.token);
        if (result && result.statusCode === 200 && result.response.result) {
            RTCManger.getInstance(AnswerCallManger.instance._options).getLocalStream();
            RoomOperation.getInstance(AnswerCallManger.instance._options).render(call);
            onfire.fire('onCallAnswered', call);
            AnswerCallManger.instance.sendToId = `customer_${call.cid}`;
            this._changeCallStatus(call.sid, 'answered');
            this._removeCallFromArray(call);
            this._removeCall(call.sid);
            if ($('#txtVideoCallCenterSwitch').prop('checked')) {
                $(document.body).find(`#txtAudio${call.sid}`).remove();
                setTimeout(() => {
                    this._autoAnswerCall();
                }, 2000);
            } else {
                this._render();
            }
        }
    }

    getSendToId() {
        return AnswerCallManger.instance.sendToId;
    }

    callComing(call) {
        //有新的呼叫呼入
        if (AnswerCallManger.instance._hasAnsweredCallMap.get(call.sid)) {
            if (call.status === 'wait_answer') {
                if ($('#txtVideoCallCenterSwitch').prop('checked')) {
                    this._autoAnswerCall();
                } else {
                    this._render();
                }
            }
            return;
        }
        AnswerCallManger.instance._hasAnsweredCallMap.set(call.sid, call);
        AnswerCallManger.instance._callList.push(call);
        VideoDialog.getInstance().show();
        MinDialogManger.getInstance().hidden();
        if ($('#txtVideoCallCenterSwitch').prop('checked')) {
            this._autoAnswerCall();
        } else {
            this._render();
        }
        onfire.fire('onCallComing', call);
    }

    _changeCallStatus(sid, status) {
        const call = AnswerCallManger.instance._hasAnsweredCallMap.get(sid);
        if (call) {
            call.current_status = status;
            AnswerCallManger.instance._hasAnsweredCallMap.set(sid, call);
        }
    }

    callCancel(call) {
        //呼叫取消 or 挂断
        RoomOperation.getInstance(AnswerCallManger.instance._options).callEnd(call);
        this._removeCallFromArray(call);
        this._removeCall(call.sid);
        this._render();
        this._changeCallStatus(call.sid, 'cancel');
        console.log('callCancel: ', AnswerCallManger.instance._callList);
    }

    _removeCallFromArray(call) {
        AnswerCallManger.instance._callList.splice(
            AnswerCallManger.instance._callList.findIndex(item => item.sid === call.sid),
            1
        );
    }

    _render() {
        //渲染接听布局
        const arr = this._unique(AnswerCallManger.instance._callList);
        if (arr.length > 0) {
            const call = arr[0];
            if (!$(`#answerLayout${call.sid}`)[0]) {
                $('#txtVideoCallCenter').append(answerFooter(this._getRenderParams(call)));
                this._addHandle(call.sid);
                this._playAudio(call.sid);
                this._startTimer(call.sid);
            }
        }
    }

    _removeCall(sid) {
        //已接听或者已经取消的呼叫从当前集合中删除（如果dom已被渲染，那么被渲染的dom也应该一起删除）
        $('#txtVideoCallCenter').find(`#answerLayout${sid}`).remove();
        this._stopTimer();
    }

    _addHandle(sid) {
        //添加按钮点击事件
        $(`#answerCall${sid}`).one('click', (event) => {
            event.target.dataset.showName = event.target.dataset.showname;
            this._answerCall(event.target.dataset);
        });
    }

    /**
     * 数组去重
     * @param array
     * @private
     */
    _unique(array) {
        const res = new Map();
        return array.filter((a) => !res.has(a.sid) && res.set(a.sid, 1));
    }

    /**
     * 获取渲染模版参数
     * @param call
     * @return {{}}
     * @private
     */
    _getRenderParams(call) {
        const renderParams = {};
        renderParams.showName = call.showName === "" ? call.cid : call.showName;
        renderParams.cid = call.cid;
        renderParams.sid = call.sid;
        renderParams.extra = call.extra;
        const extra = call.extra ? JSON.parse(call.extra) : {};
        renderParams.callType = AnswerCallManger.instance._callType[extra.terminalDevice] === undefined
            ? 'txt-video-room-call-type-web'
            : AnswerCallManger.instance._callType[extra.terminalDevice];
        return renderParams;
    }

    _playAudio(sid) {
        if (AnswerCallManger.instance._options.notice !== ""
            && AnswerCallManger.instance._options.notice !== null
            && AnswerCallManger.instance._options.notice !== 'null'
            && AnswerCallManger.instance._options.notice !== undefined
            && AnswerCallManger.instance._options.notice !== 'undefined'
        ) {
            $(`#answerLayout${sid}`).append(`
                <audio style="visibility: hidden;" autoplay loop src="${AnswerCallManger.instance._options.notice}"></audio> 
            `)
        }
    }

    _startTimer(sid) {
        AnswerCallManger.instance._timer = new Timer();
        AnswerCallManger.instance._timer.startTimer((timer) => {
            $(`#answerCall${sid}`).text(`(${timer}) 接受`);
        });
    }

    _stopTimer() {
        if (AnswerCallManger.instance._timer) {
            AnswerCallManger.instance._timer.destroy();
            AnswerCallManger.instance._timer = null;
        }
    }

    destroy() {
        this._stopTimer();
        this.clearRecordCallMap();
        AnswerCallManger.instance._callList = [];
    }

    mixedSuccess(call) {
        RoomOperation
            .getInstance(AnswerCallManger.instance._options)
            .render(call);
    }

    clearRecordCallMap() {
        AnswerCallManger.instance._hasAnsweredCallMap.clear();
    }

    _autoAnswerCall() {
        const arr = this._unique(AnswerCallManger.instance._callList);
        console.log('Answer Call arry: ', arr);
        if (arr.length > 0) {
            const call = arr[0];
            if (!$(`#txtAudio${call.sid}`)[0]) {
                $(document.body).append(`
                    <audio id="txtAudio${call.sid}" style="visibility: hidden;" autoplay src="${AnswerCallManger.instance._options.notice}"></audio> 
                `);
                this._answerCall(call);
            }
        }
    }

}