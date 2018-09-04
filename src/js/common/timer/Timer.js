export default class Timer {
    constructor() {
        this.timer = null;
        this.countdownTimer = null;
    }

    startTimer(cb) {
        let hour = 0;
        let minute = 0;
        let second = 0;
        this.timer = setInterval(() => {
            if (second >= 60) {
                second = 0;
                minute += 1;
            }
            if (minute >= 60) {
                minute = 0;
                hour += 1;
            }
            const h = hour;
            const m = minute;
            const s = second;
            if (h > 0) {
                cb && cb(`${h}h`);
                second += 1;
                return;
            }
            if (m > 0) {
                cb && cb(`${m}m`);
                second += 1;
                return;
            }
            cb && cb(`${s}s`);
            second += 1;
        }, 1000);
    }

    startCountdown(s, cb) {
        let second = s;
        this.countdownTimer = setInterval(() => {
            cb && cb(`${second}s`);
            if (second === 0) {
                if (this.countdownTimer) {
                    clearInterval(this.countdownTimer);
                    this.countdownTimer = null;
                }
                return;
            }
            second -= 1;
        }, 1000);
    }

    destroy() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
}