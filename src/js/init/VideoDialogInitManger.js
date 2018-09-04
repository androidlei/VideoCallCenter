import $ from 'jquery';
import toastr from 'toastr';
import defaultOptions from '../common/options/DefaultOptions';
import {fetchPost} from '../common/http/Fetch';
import MCUManger from '../common/mcu/MCUManger';
import SocketManger from '../common/socket/SocketManger';
import RoomOperation from '../room-operation/RoomOperation';
import VideoDialog from '../video-dialog/VideoDialog';
import MinDialogManger from "../min-dialog/MinDialogManger";
import Participant from "../participant/Participant";
import AnswerCallManger from "../answer-call/AnswerCallManger";

export default class VideoDialogInitManger {
    static getInstance() {
        if (!VideoDialogInitManger.instance || !VideoDialogInitManger.instance instanceof this) {
            VideoDialogInitManger.instance = new this;
            VideoDialogInitManger.instance_isLogin = false;
            VideoDialogInitManger.instance_isLogout = false;
        }
        return VideoDialogInitManger.instance;
    }

    init(opts = {}) {
        this.options = Object.assign(defaultOptions, opts);
        console.log('初始化参数：', this.options);
        this.checkInlineTiming = null;
        this._render();
    }

    _render() {
        VideoDialog.getInstance().render(this.options);
        MinDialogManger.getInstance().render({num: 0, msg: '当前暂无视屏...'});
        this._getMCUToken();
    }

    async _getMCUToken() {
        const result = await fetchPost(`${this.options.serverUrl}/agent/createMtoken`, {aid: this.options.id}, this.options.token);
        if (result && result.statusCode === 200) {
            const mcuToken = result.response.mUserToken;
            MCUManger.getInstance(this.options).join(mcuToken, (msg) => {
                if (msg.code === 200) {
                    //订阅混流成功 初始化socket
                    SocketManger.getInstance(this.options).init((result) => {
                        if (result.code === 200) {
                            //socket初始化成功调用登录接口登录呼叫中心
                            if (!VideoDialogInitManger.instance_isLogin) {
                                this._loginCallCenter();
                            }
                        } else {
                            this.options.initCallBack && this.options.initCallBack(result);
                        }
                    })
                } else {
                    this.options.initCallBack && this.options.initCallBack(msg);
                }
            });
        } else {
            this.options.initCallBack && this.options.initCallBack({code: 500, msg: result});
        }
    }

    async _loginCallCenter() {
        const loginResult = await fetchPost(`${this.options.serverUrl}/agent/login`, {
            'aid': `${this.options.id}`,
            'token': `${this.options.token}`
        }, this.options.token);
        if (loginResult && loginResult.statusCode === 200) {
            RoomOperation.getInstance(this.options).render();
            this.checkInlineTiming = setInterval(() => {
                this._checkOnLine();
            }, 5000);
            VideoDialogInitManger.instance_isLogin = true;
            MinDialogManger.getInstance().show();
            this.options.initCallBack && this.options.initCallBack({code: 200, msg: loginResult});
        } else {
            VideoDialogInitManger.instance_isLogin = false;
            this.options.initCallBack && this.options.initCallBack({code: 500, msg: loginResult});
        }
    }

    async _logoutCallCenter(cb) {
        const logout = await fetchPost(`${this.options.serverUrl}/agent/logout`, {
            "aid": `${this.options.id}`,
            "token": `${this.options.token}`
        }, this.options.token);
        if (logout && logout.statusCode === 200) {
            cb && cb({code: 200, msg: logout});
        } else {
            cb && cb({code: 500, msg: logout});
        }
        this._destroy();
    }

    _destroy() {
        if (this.checkInlineTiming) {
            clearInterval(this.checkInlineTiming);
            this.checkInlineTiming = null;
        }
        VideoDialogInitManger.instance_isLogin = false;
        VideoDialog.getInstance().destroy();
        MinDialogManger.getInstance().destroy();
        RoomOperation.getInstance(this.options).destroy();
        MCUManger.getInstance(this.options).destroy();
        SocketManger.getInstance(this.options).disConnectSocket();
        AnswerCallManger.getInstance(this.options).destroy();
    }

    logout(cb) {
        this._logoutCallCenter(cb);
    }

    sendMessage(message, cid, cb) {
        MCUManger.getInstance(this.options).sendMessage(message, Participant.getInstance().getParticipant(cid), cb);
    }

    setAgentStatus(available, cb) {
        this._setStatus(available, cb);
    }

    async _setStatus(available, cb) {
        const params = {
            aid: this.options.id,
            available: available === 0 ? false : true
        };
        const result = await fetchPost(`${this.options.serverUrl}/agent/setStatus`, params, this.options.token);
        if (result && result.statusCode === 200) {
            cb && cb({code: 200, msg: result});
        } else {
            cb && cb({code: 500, msg: result});
        }
    }

    async _checkOnLine() {
        const result = await fetchPost(`${this.options.serverUrl}/agent/checkOnline`, {aid: this.options.id}, this.options.token);
        if (result && result.statusCode === 200) {
            const online = result.response.online;
            console.log('Online Status: ', online);
            if (!online) {
                this.logout();
                const resetTime = setTimeout(() => {
                    this.init(this.options);
                    clearTimeout(resetTime);
                }, 2000);
            }
        }
    }

    setAnswerStauts(status) {
        $('#txtVideoCallCenterSwitch').attr('checked', status);
    }

}