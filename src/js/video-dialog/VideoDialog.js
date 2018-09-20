import $ from "jquery";
import Drag from "../common/drag/Drag";
import dialog from '../templates/dialog/Dialog';
import header from '../templates/header/video-header/VideoHander';
import content from '../templates/content/VideoContent';
import MinDialogManger from '../min-dialog/MinDialogManger';
import PreImgDialog from './PreImgDialog';

export default class VideoDialog {
    static getInstance() {
        if (!VideoDialog.instance || !VideoDialog.instance instanceof this) {
            VideoDialog.instance = new this;
            VideoDialog.instance._drag = null;
            VideoDialog.instance._isFullScreen = false;
            VideoDialog.instance._isZoom = false;
            VideoDialog.instance._rWidth = 0;
            VideoDialog.instance._rHeight = 0;
            VideoDialog.instance._wWidth = 0;
            VideoDialog.instance._wHeight = 0;
            VideoDialog.instance._rLeft = 0;
            VideoDialog.instance._rTop = 0;
        }
        return VideoDialog.instance;
    }

    render(opts = {}) {
        $(document.body).append(dialog({}));
        $('#txtVideoCallCenter').css({'height': `${opts.height}px`});
        $('#txtVideoCallCenter').append(header({}));
        $('#txtVideoCallCenter').append(content({}));
        PreImgDialog.getInstance().render();
        this._addHandler();
    }

    show() {
        if ($('#txtVideoCallCenter').css('display') === 'flex') return;
        $('#txtVideoCallCenter').animateCss('zoomIn');
        $('#txtVideoCallCenter').css({'display': 'flex'});
        if (MinDialogManger.getInstance().getShowStatus()) {
            MinDialogManger.getInstance().hidden();
        }
        this._getVideoStyle();
        this._addDrag();
    }

    hidden() {
        $('#txtVideoCallCenter').animateCss('zoomOut', () => {
            $('#txtVideoCallCenter').css({'display': 'none'});
            MinDialogManger.getInstance().show();
        });
    }

    destroy() {
        VideoDialog.instance._drag = null;
        $(document.body).find('#txtVideoCallCenter').remove();
    }

    _addHandler() {
        $('#txtVideoCallZoom').on('click', () => {
            if (VideoDialog.instance._isFullScreen) return;
            if (VideoDialog.instance._isZoom) {
                $('#txtVideoCallCenter').animate({
                    height: `${VideoDialog.instance._rHeight * 2}px`,
                    width: `${VideoDialog.instance._rWidth * 2}px`,
                }, () => {
                    VideoDialog.instance._isZoom = false;
                    this._recordWidthAndHeight();
                });
                $('#txtVideoCallCenterOperation').animate({
                    width: `${$('#txtVideoCallCenterOperation').width() * 2}px`,
                });
            } else {
                $('#txtVideoCallCenter').animate({
                    height: `${VideoDialog.instance._rHeight / 2}px`,
                    width: `${VideoDialog.instance._rWidth / 2}px`,
                }, () => {
                    VideoDialog.instance._isZoom = true;
                    this._recordWidthAndHeight();
                });
                $('#txtVideoCallCenterOperation').animate({
                    width: `${$('#txtVideoCallCenterOperation').width() / 2}px`,
                });
            }
        });
        $('#txtVideoCallHeaderPreImg').on('click', () => {
            PreImgDialog.getInstance().show();
        });
        $('#txtVideoCallFullScreen').on('click', () => {
            PreImgDialog.getInstance().hidden();
            if (VideoDialog.instance._isFullScreen) {
                this._exitFullScreen();
                this._recordWidthAndHeight();
            } else {
                this._recordWidthAndHeight();
                this._fullScreen()
            }
            const videoWidth = $('#txtVideoCallCneterVideo').width();
            $('#txtVideoCallCenterOperation').css({'width': `${videoWidth}px`});
        });
        $('#txtVideoCallClose').on('click', () => {
            this.hidden();
        });
    }

    _addDrag() {
        if (!VideoDialog.instance._drag) {
            VideoDialog.instance._drag = new Drag({
                drag: 'txtVideoCallCenter',
                handle: 'txtVideoCallHeader',
                buttons: [
                    'txtVideoCallFullScreen',
                    'txtVideoCallClose',
                    'txtVideoCallZoom',
                ],
                limit: true,
                lockX: false,
                lockY: false,
                lock: false
            });
        }
        this._recordWidthAndHeight();
        this._recordWindow($(window).width(), $(window).height());
    }

    _fullScreen() {
        const elem = document.body;
        if (elem.webkitRequestFullScreen) {
            elem.webkitRequestFullScreen();
        } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
        } else if (elem.requestFullscreen) {
            elem.requestFullscreen();
        }
        VideoDialog.instance._isFullScreen = true;
        $('#txtVideoCallCenter').css({
            'left': '0',
            'top': '0',
            'width': '100%',
            'height': '100%'
        });
    }

    _exitFullScreen() {
        var elem = document;
        if (elem.webkitCancelFullScreen) {
            elem.webkitCancelFullScreen();
        } else if (elem.mozCancelFullScreen) {
            elem.mozCancelFullScreen();
        } else if (elem.cancelFullScreen) {
            elem.cancelFullScreen();
        } else if (elem.exitFullscreen) {
            elem.exitFullscreen();
        }
        VideoDialog.instance._isFullScreen = false;
        $('#txtVideoCallCenter').css({
            'left': `${VideoDialog.instance._rLeft}px`,
            'top': `${VideoDialog.instance._rTop}px`,
            'width': `${VideoDialog.instance._rWidth}px`,
            'height': `${VideoDialog.instance._rHeight}px`,
        });
    }

    _recordWidthAndHeight() {
        VideoDialog.instance._rWidth = $('#txtVideoCallCenter').width();
        VideoDialog.instance._rHeight = $('#txtVideoCallCenter').height();
        VideoDialog.instance._rLeft = $('#txtVideoCallCenter').offset().left;
        VideoDialog.instance._rTop = $('#txtVideoCallCenter').offset().top;
    }

    _recordWindow(width, height) {
        VideoDialog.instance._wWidth = width;
        VideoDialog.instance._wHeight = height;
    }

    _getVideoStyle() {
        const videoWidth = $('#txtVideoCallCneterVideo').width();
        $('#txtVideoCallCenter').css({'width': `${videoWidth + 10}px`});
        $('#txtVideoCallCenterOperation').css({'width': `${videoWidth}px`});
    }
}