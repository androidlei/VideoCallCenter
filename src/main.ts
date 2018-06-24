import { sayHello } from "./greet";
function showHello(divName: string, name: string) {
    const elt = document.getElementById(divName);
    elt.innerText = sayHello(name);
}

export default class VideoCallCenter {
    private _divName: string;
    private _msg: string;
    constructor(divName: string, msg: string) {
      this._divName = divName;
      this._msg = msg;
    }

    public render(): void {
      showHello(this._divName, this._msg);
    }
}
