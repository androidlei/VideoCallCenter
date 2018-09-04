import $ from 'jquery';
import onfire from 'onfire.js';
import notConnected from '../templates/not-connected/NotConnected';
import GetRoomInfo from '../common/room-info/GetRoomInfo';
import Customer from '../templates/customer/Customer';
import Participant from '../participant/Participant';
import {fetchPost} from "../common/http/Fetch";
import AnswerCallManger from "../answer-call/AnswerCallManger";
import MinDialogManger from "../min-dialog/MinDialogManger";

export default class RoomOperation {
    static getInstance(opts = {}) {
        if (!RoomOperation.instance || !RoomOperation.instance instanceof this) {
            RoomOperation.instance = new this;
            RoomOperation.instance._options = opts;
            RoomOperation.instance._customers = new Map();
            RoomOperation.instance._talkAndActive = new Map();
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
        GetRoomInfo(RoomOperation.instance._options, (info) => {
            if (info.code === 200) {
                const customers = info.customers;
                if (customers && customers.length === 0) RoomOperation.instance._customers.clear();
                customers.map((customer) => {
                    if (call.sid === customer.sid) {
                        customer.showName = call.showName === '' ? call.cid : call.showName;
                        customer.extra = call.extra;
                        customer.isWaiting = true;
                        customer.isRequestTalking = false;
                        customer.isTalking = false;
                        customer.opClassName = 'txt-video-room-mute-btn-close';
                        customer.animation = (cb) => {
                            return setTimeout(cb, 2000);
                        };
                        customer.countdown = (cb) => {
                          return setInterval(cb, 1000);
                        };
                        customer.timer = (cb) => {
                            return setInterval(cb, 1000);
                        };
                        RoomOperation.instance._customers.set(customer.sid, customer);
                    }
                });
                this._renderOperation();
            } else {
                $('#txtVideoCallCenterOperation').html(notConnected({}));
            }
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
            if (item.isWaiting && !item.timing) {
                $('#txtVideoCallCenterOperation').html(Customer({customers: [...RoomOperation.instance._customers.values()]}));
                item.animaTiming = item.animation(() => {
                    item.isWaiting = false;
                    if (item.animaTiming) {
                        clearTimeout(item.animaTiming);
                        item.animaTiming = null;
                    }
                    RoomOperation.instance._customers.set(item.sid, item);
                    $('#txtVideoCallCenterOperation').html(Customer({customers: [...RoomOperation.instance._customers.values()]}));
                    this._addHandle();
                    this._startTimer();
                });
            } else {
                $('#txtVideoCallCenterOperation').html(Customer({customers: [...RoomOperation.instance._customers.values()]}));
                this._addHandle();
            }
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
        }
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
                $('#txtVideoCallingName').text(`正在与${call.showname}对讲中`);
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
            if(c.timerTime) {
                clearInterval(c.timerTime);
                c.timerTime = null;
            };
            if(c.timing) {
                clearInterval(c.timing);
                c.timing = null;
            };
            if (c.isTalking) {
                $('#txtVideoCallingName').text('');
            }
            onfire.fire('onCallEnd', call);
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
            if (!c.timing) {
                let time = 60;
                c.timing = c.countdown(() => {
                    if ($(`#txtVideoCallCenterRequestTalk${c.sid}`)[0]) {
                        c.cutDownTime = `(${time}s) 接受`;
                        RoomOperation.instance._customers.set(c.sid, c);
                        $(`#txtVideoCallCenterRequestTalk${c.sid}`).text(`(${time}s) 接受`)
                    }
                    if (time === 0) {
                        if (c.timing) {
                            clearInterval(c.timing);
                            c.timing = null;
                            c.isRequestTalking = false;
                            RoomOperation.instance._customers.set(c.sid, c);
                            this._calculationStatus();
                            return;
                        }
                    }
                    time -= 1;
                });
            }
        }
    }

    _startTimer() {
        const customers = [...RoomOperation.instance._customers.values()];
        customers.forEach((customer) => {
            if (!customer.timerTime) {
                let minute = 0;
                let second = 0;
                customer.timerTime = customer.timer(() => {
                    if (second >= 60) {
                        second = 0;
                        minute += 1;
                    }
                    const time = `${minute >= 10 ? minute : '0' + minute}:${second >= 10 ? second : '0' + second}`;
                    if ($(`#txtVideoCallCenterTimer${customer.sid}`)[0]) {
                        $(`#txtVideoCallCenterTimer${customer.sid}`).text(`${time}`);
                        customer.wTimer = time
                        RoomOperation.instance._customers.set(customer.sid, customer);
                    }
                    second += 1;
                })
            }
        });
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

    onStreamEnded(pid) {
        const customers = [...RoomOperation.instance._customers.values()];
        customers.forEach((customer) => {
            if (customer.pid === pid) {
                this._endCall(customer, true);
            }
        });
        this._calculationStatus();
    }

    synchronizeRoomInfo(customers = []) {
        this._synchronizeMCURoomInfo();
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

    _synchronizeMCURoomInfo() {
        const calls = [...RoomOperation.instance._customers.values()];
        let result = [];
        GetRoomInfo(RoomOperation.instance._options, (info) => {
            if (info.code === 200) {
                const customers = info.customers;
                if (!customers) {
                    return;
                }
                if (customers.length === 0) {
                    RoomOperation.instance._customers.clear();
                    this._calculationStatus();
                } else if (customers.length !== calls.length) {
                    for (let i = 0; i < customers.length; i++) {
                        let customer = customers[i];
                        let flag = false;
                        for (let j = 0; j < calls.length; j++) {
                            let call = calls[j];
                            if (customer.sid === call.sid) {
                                flag = true;
                                break;
                            }
                        }
                        if (!flag) {
                            result.push(customer);
                        }
                    }
                    this._exceptionEndCall(result);
                }
            }
        });
    }

}