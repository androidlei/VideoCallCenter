import './common/polyfill';
import './common/animation/AnimateCssEnd';
import VideoDialogInitManger from './init/VideoDialogInitManger';
import onfire from 'onfire.js';

const init = (opts = {}) => {
    VideoDialogInitManger.getInstance().init(opts);
};

const logout = (cb) => {
    VideoDialogInitManger.getInstance().logout(cb);
};

const sendMessage = (message, cb) => {
    VideoDialogInitManger.getInstance().sendMessage(message.entry, message.cid, cb);
};

const setAgentStatus = (available, cb) => {
    VideoDialogInitManger.getInstance().setAgentStatus(available, cb);
};

const on = (eventType, handler) => {
    onfire.on(eventType, handler);
};

const setAnswerStauts = (status) => {
    VideoDialogInitManger.getInstance().setAnswerStauts(status);
};

const sendPicMessage = (file, cb) => {
    VideoDialogInitManger.getInstance().sendPicMessage(file, cb);
};

export {init, logout, sendMessage, setAgentStatus, on, setAnswerStauts, sendPicMessage};