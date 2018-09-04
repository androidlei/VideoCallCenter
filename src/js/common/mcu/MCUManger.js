import $ from 'jquery';
import onfire from 'onfire.js';
import '../lib/socket.io';
import '../lib/ics';
import RoomOperation from "../../room-operation/RoomOperation";
import toastr from "toastr";
import {fetchPost} from "../http/Fetch";

export default class MCUManger {

    static getInstance(opts = {}) {
        if (!MCUManger.instance || !MCUManger.instance instanceof this) {
            MCUManger.instance = new this;
            MCUManger.instance._options = opts;
            MCUManger.instance._tracks = null;
            MCUManger.instance._resp = null;
            MCUManger.instance._isEnded = false;
            MCUManger.instance._publication = null;
            MCUManger.instance._subscription = null;
            MCUManger.instance._mixedStream = null;
            MCUManger.instance._stream = null;
            MCUManger.instance._conference = new Ics.Conference.ConferenceClient();
            MCUManger.instance._streamAddListener();
            MCUManger.instance._messageReceivedListener();
            MCUManger.instance._serverDisconnectedListener();
            MCUManger.instance._participantJoinedListener();
        }
        return MCUManger.instance;
    }

    destroy() {
        if (MCUManger.instance._tracks) {
            MCUManger.instance._tracks.forEach((track) => {
                track.stop();
            });
            MCUManger.instance._tracks = null;
        }

        if (MCUManger.instance._resp) {
            MCUManger.instance._resp = null;
        }
        this._removeEventListener();
        MCUManger.instance = null;
    }

    /**
     * 加入房间
     * @param token
     * @param cb
     */
    join(token, cb) {
        MCUManger.instance._conference.join(token)
            .then((resp) => {
                MCUManger.instance._resp = resp;
                this._publish(resp, cb);
            }, (err) => {
                cb && cb({code: 500, msg: err});
            })
    }

    /**
     * 发送IM消息
     * @param message
     * @param participantId
     * @param cb
     */
    sendMessage(message, participantId, cb) {
        if (!participantId) {
            cb({code: 500, msg: 'No participant ID found'});
            return;
        }
        console.log('sendMessage: ', message);
        console.log('ParticipantId: ', participantId);
        MCUManger.instance._conference.send(message, participantId)
            .then((success) => {
                cb && cb({code: 200, msg: 'Send message success!'});
            }, (error) => {
                cb && cb({code: 500, msg: error});
            });
    }

    /**
     * 发布本地流
     * @param resp
     * @param cb
     */
    _publish(resp, cb) {
        const audioConstraintsForMic = new Ics.Base.AudioTrackConstraints(Ics.Base.AudioSourceInfo.MIC);
        const videoConstraintsForCamera = MCUManger.instance._options.video
            ? new Ics.Base.VideoTrackConstraints(Ics.Base.VideoSourceInfo.CAMERA)
            : false;
        Ics.Base.MediaStreamFactory.createMediaStream(new Ics.Base.StreamConstraints(
           audioConstraintsForMic, videoConstraintsForCamera
        ))
            .then((stream) => {
                MCUManger.instance._tracks = stream.getTracks();
                const localStream = new Ics.Base.LocalStream(stream, new Ics.Base.StreamSourceInfo('mic', 'camera'));
                MCUManger.instance._conference.publish(localStream)
                    .then((publication) => {
                        MCUManger.instance._publication = publication;
                        publication.addEventListener('error', (err) => {
                            console.log('publication: ', err);
                            // cb && cb({code: 500, msg: 'Local media stream failed to publish'});
                        });
                        publication.addEventListener('ended', (err) => {
                            console.log('publication ended: ', err);
                            if (MCUManger.instance && MCUManger.instance._options) {
                                // if (!MCUManger.instance._isEnded) {
                                //     MCUManger.instance._isEnded = true;
                                //     toastr.error('视频网路服务异常，将退出重新初始化', '异常提示！');
                                //     this._logoutCallCenter();
                                // }
                            }
                        });
                        this._subscribeStream(resp, cb);
                    });
            }, (err) => {
                toastr.error('无法创建本地音视频流，请检查本地媒体设备正常后，重新登录', '登录失败！');
                cb && cb({code: 500, msg: 'Failed to create local media stream'});
            })
    }

    /**
     * 订阅流
     * @param resp
     * @param cb
     */
    _subscribeStream(resp, cb) {
        for (const stream of resp.remoteStreams) {
            if (stream.source.audio === 'mixed' || stream.source.video === 'mixed') {
                MCUManger.instance._conference.subscribe(stream, {
                    audio: {codecs: [{name: 'opus'}]},
                    video: true
                }).then((subscription) => {
                    MCUManger.instance._subscription = subscription;
                    $('#txtVideoCallCneterVideo').prop('srcObject', stream.mediaStream);
                    MCUManger.instance._mixedStream = stream;
                    stream.addEventListener('layoutchange', (event) => {
                        console.error('Layout Change: ', event);
                    });
                    cb && cb({code: 200, msg: 'Subscribe to the mixed media stream successfully'});
                    subscription.addEventListener('error', (err) => {
                        console.log('Subscription error: ' + err.error.message);
                        // cb && cb({code: 500, msg: err});
                    });
                })
            }
        }
    }

    /**
     * 流加入或者退出事件
     */
    _streamAddListener() {
        MCUManger.instance._conference.addEventListener('streamadded', (event) => {
           //TODO: 新流加入
            console.log('A new stream is added', event);
            MCUManger.instance._stream = event.stream;
            event.stream.addEventListener('ended', () => {
               //TODO: 流退出
                console.log('A new stream is ended', event);
                if (MCUManger.instance && MCUManger.instance._options) {
                    RoomOperation.getInstance(MCUManger.instance._options).onStreamEnded(event.stream.origin);
                }
            });
        });
    }

    /**
     * 接受IM消息
     */
    _messageReceivedListener() {
        MCUManger.instance._conference.addEventListener('messagereceived', (event) => {
            onfire.fire('message', event.message);
        });
    }

    /**
     * ICE链接断开
     */
    _serverDisconnectedListener() {
        MCUManger.instance._conference.addEventListener('serverdisconnected', (event) => {
            console.log('Server Disconnected: ', event);
            // if (MCUManger.instance && MCUManger.instance._resp) {
            //     this._publish(MCUManger.instance._resp, null);
            // }
        });
    }

    /**
     * 新的参与者加入
     */
    _participantJoinedListener() {
        MCUManger.instance._conference.addEventListener('participantjoined', (event) => {
            console.log('Participant Joined: ', event);
        });
    }

    async _logoutCallCenter() {
        const logout = await fetchPost(`${MCUManger.instance._options.serverUrl}/agent/logout`, {
            "aid": `${MCUManger.instance._options.id}`,
            "token": `${MCUManger.instance._options.token}`
        }, MCUManger.instance._options.token);
    }

    _removeEventListener() {
        MCUManger.instance._conference.clearEventListener('participantjoined');
        MCUManger.instance._conference.clearEventListener('streamadded');
        MCUManger.instance._conference.clearEventListener('serverdisconnected');
        MCUManger.instance._conference.clearEventListener('messagereceived');
        MCUManger.instance._conference.clearEventListener('error');
        MCUManger.instance._conference.clearEventListener('ended');
        MCUManger.instance._conference.clearEventListener('layoutchange');

        MCUManger.instance._publication.clearEventListener('error');
        MCUManger.instance._publication.clearEventListener('ended');

        MCUManger.instance._subscription.clearEventListener('error');

        MCUManger.instance._mixedStream.clearEventListener('layoutchange');

        MCUManger.instance._stream.clearEventListener('ended');
    }
}