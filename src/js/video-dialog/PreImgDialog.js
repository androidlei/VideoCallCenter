import $ from "jquery";
import Drag from "../common/drag/Drag";
import preImgDialog from '../templates/dialog/PreImgDialog';
import header from '../templates/header/img-preview-header/PreImgVideoHander';
import content from '../templates/content/PreImgContent';
import onfire from 'onfire.js';

export default class PreImgDialog {
    static getInstance() {
        if (!PreImgDialog.instance || !PreImgDialog.instance instanceof this) {
            PreImgDialog.instance = new this;
            PreImgDialog.instance._drag = null;
        }
        return PreImgDialog.instance;
    }

    render() {
        $('#txtVideoCallCenter').append(preImgDialog({}));
        $('#txtPreImgDialog').append(header({}));
        $('#txtPreImgDialog').append(content({}));
        this._addHandler();
    }

    show() {
        if ($('#txtPreImgDialog').css('display') === 'flex') return;
        $('#txtPreImgDialog').animateCss('zoomIn');
        $('#txtPreImgDialog').css({'display': 'flex'});
        this._addDrag();
    }

    hidden() {
        $('#txtPreImgDialog').animateCss('zoomOut', () => {
            $('#txtPreImgDialog').css({'display': 'none'});
        });
    }

    _addHandler() {
        $('#txtVideoCallPreImgClose').on('click', () => {
            this.hidden();
        });
    }

    _addDrag() {
        if (!PreImgDialog.instance._drag) {
            PreImgDialog.instance._drag = new Drag({
                drag: 'txtVideoCallCenter',
                handle: 'txtVideoCallPreImgHeader',
                buttons: [
                    'txtVideoCallPreImgClose',
                ],
                limit: true,
                lockX: false,
                lockY: false,
                lock: false
            });
        }
    }

    addImg(img) {
        const divDom = document.createElement('div');
        const imgDiv = document.createElement('img');
        imgDiv.src = img;
        imgDiv.onclick = this.preImg;
        divDom.appendChild(imgDiv);
        // $('#txtPreImgContent').prepend(`<!--<img id="img${i}" src="${img}" class="zoomIn animated" onclick=""/>-->`);
        $('#txtPreImgContent').prepend(divDom);
    }

    preImg(event) {
        console.log(event);
        const imgUrl = event.target.currentSrc;
        onfire.fire('imgPre', imgUrl);
    }

}
