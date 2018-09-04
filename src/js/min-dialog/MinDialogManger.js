import $ from "jquery";
import MinDialog from '../templates/min-dialog/MinDialog';
import Drag from "../common/drag/Drag";
import VideoDialog from "../video-dialog/VideoDialog";

export default class MinDialogManger {
    static getInstance() {
        if (!MinDialogManger.instance || !MinDialogManger.instance instanceof this) {
            MinDialogManger.instance = new this;
            MinDialogManger.instance._Drag = null;
            MinDialogManger.instance._isShow = false;
        }
        return MinDialogManger.instance;
    }

    render(params) {
        $(document.body).find('#txtVideoCallMinDialog').remove();
        $(document.body).append(MinDialog({num: params.num, hasNum: params.num === 0 ? false : true, stateText: params.msg}));
        this._addHandler();
    }

    setNum(params) {
        const num = params.num;
        const text = params.msg;
        $('#txtText').text(text);
        if (num <= 0) {
            if ($('#txtVideoCallMinDialog').find('#txtNum')[0]) {
                $('#txtVideoCallMinDialog').find('#txtNum').remove();
            }
        } else {
            if ($('#txtVideoCallMinDialog').find('#txtNum')[0]) {
                $('#txtNum').text(num);
            } else {
                $('#txtVideoCallMinDialog').append(`<span id="txtNum" class="txt-min-dialog-num">${num}</span>`);
            }
        }
    }

    show() {
        $('#txtVideoCallMinDialog').animateCss('zoomIn');
        $('#txtVideoCallMinDialog').css({'display': 'flex'});
        MinDialogManger.instance._isShow = true;
        this._addDrag();
    }

    hidden() {
        $('#txtVideoCallMinDialog').animateCss('zoomOut', () => {
            $('#txtVideoCallMinDialog').css({'display': 'none'});
            MinDialogManger.instance._isShow = false;
            VideoDialog.getInstance().show();
        });
    }

    destroy() {
        MinDialogManger.instance._Drag = null;
        MinDialogManger.instance._isShow = false;
        $(document.body).find('#txtVideoCallMinDialog').remove();
    }

    _addHandler() {
        $('#txtMinDialogImg').on('click', () => {
            this.hidden();
        });
    }

    getShowStatus() {
        return MinDialogManger.instance._isShow;
    }

    _addDrag() {
        if (!MinDialogManger.instance._Drag) {
            MinDialogManger.instance._Drag = new Drag({
                drag: 'txtVideoCallMinDialog',
                handle: 'txtVideoCallMinDialog',
                buttons: [
                    'txtMinDialogImg',
                ],
                limit: true,
                lockX: false,
                lockY: false,
                lock: false
            });
        }
    }
}