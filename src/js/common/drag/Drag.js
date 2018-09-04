export default class Drag {
    constructor(opts = {}) {
        this.drag = this._$(opts.drag);
        this.handle = this._$(opts.handle);

        this._x = 0;
        this._y = 0;
        this.moveDrag = this._bind(this, this._moveDrag);
        this.stopDrag = this._bind(this, this._stopDrag);

        this.container = document.documentElement;
        this.maxContainer = this._$(this.container);

        this.maxTop = 0;
        this.maxLeft = 0;

        this.limit = opts.limit;
        this.lockX = opts.lockX;
        this.lockY = opts.lockY;
        this.lock = opts.lock;

        this.buttons = opts.buttons;

        this.onMove = opts.onMove;

        this.handle.style.cursor = 'move';

        this._changeLayout();

        this._btnClick();

        this._addHandler(this.handle, 'mousedown', this._bind(this, this._startDrag));
    }

    setLimit(limit) {
        this.limit = limit;
    }

    setLockX(lockX) {
        this.lockX = lockX;
    }

    setLockY(lockY) {
        this.lockY = lockY;
    }

    setLock(lock) {
        this.lock = lock;
    }

    _btnClick() {
        this.buttons.forEach((item) => {
            this._addHandler(this._$(item), 'mousedown', this._bind(this, this._unMove));
        });
    }

    _unMove(event) {
        (event || window.event).cancelBubble = true;
    }

    _changeLayout() {
        this.drag.style.top = `${this.drag.offsetTop}px`;
        this.drag.style.left = `${this.drag.offsetLeft}px`;
        this.drag.style.position = 'absolute';
        this.drag.style.margin = '0';
        this.onMove && this.onMove(this.drag.offsetTop, this.drag.offsetLeft);
    }

    _startDrag(event) {
        const e = event || window.event;

        this._x = e.clientX - this.drag.offsetLeft;
        this._y = e.clientY - this.drag.offsetTop;

        this._addHandler(document, 'mousemove', this.moveDrag);
        this._addHandler(document, 'mouseup', this.stopDrag);

        e.preventDefault && e.preventDefault();
        this.handle.setCapture && this.handle.setCapture();
    }

    _moveDrag(event) {
        const e = event || window.event;

        this.maxTop = this.maxContainer.clientHeight - this.drag.offsetHeight;
        this.maxLeft = this.maxContainer.clientWidth - this.drag.offsetWidth;

        let iTop = e.clientY - this._y;
        let iLeft = e.clientX - this._x;

        if (this.lock) return;

        const maxL = this.lockX ? this.maxLeft - 320 : this.maxLeft;
        const maxT = this.lockY ? this.maxTop - 60 : this.maxTop;

        this.limit && (iTop < 0 && (iTop = 0), iLeft < 0 && (iLeft = 0), iTop > maxT && (iTop = maxT), iLeft > maxL && (iLeft = maxL));

        this.drag.style.top = `${iTop}px`;
        this.drag.style.left = `${iLeft}px`;

        e.preventDefault && e.preventDefault();

        this.onMove && this.onMove(iTop, iLeft);
    }

    _stopDrag() {
        this._removeHandler(document, 'mousemove', this.moveDrag);
        this._removeHandler(document, 'mouseup', this.stopDrag);

        this.handle.releaseCapture && this.handle.releaseCapture();
    }

    /**
     * 添加绑定事件
     * @param oElement
     * @param sEventType
     * @param fnHandler
     * @private
     */
    _addHandler(oElement, sEventType, fnHandler) {
        return oElement.addEventListener
            ? oElement.addEventListener(sEventType, fnHandler, false)
            : oElement.attachEvent(`on${sEventType}`, fnHandler);
    }

    /**
     * 删除事件绑定
     * @param oElement
     * @param sEventType
     * @param fnHandler
     * @return {*}
     * @private
     */
    _removeHandler(oElement, sEventType, fnHandler) {
        return oElement.removeEventListener
            ? oElement.removeEventListener(sEventType, fnHandler, false)
            : oElement.detachEvent(`on${sEventType}`, fnHandler);
    }

    /**
     * 获取ID
     * @param id
     * @return {HTMLElement}
     * @private
     */
    _$(id) {
        return typeof id === 'string' ? document.getElementById(id) : id;
    }

    /**
     * 绑定事件到对象
     * @param object
     * @param fnHandler
     * @return {Function}
     * @private
     */
    _bind(object, fnHandler) {
        return function () {
            return fnHandler.apply(object, arguments);
        }
    }
}