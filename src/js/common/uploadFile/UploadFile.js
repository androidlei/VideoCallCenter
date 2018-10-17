import OSS from 'ali-oss';
import {fetchPost} from '../http/Fetch';
export default class UploadFile {

    static getInstance() {
        if (!UploadFile.instance || !UploadFile.instance instanceof this) {
            UploadFile.instance = new this;
            UploadFile.instance.Client = null;
            UploadFile.instance._directory = 'agent';
        }
        return UploadFile.instance;
    }

    init(opts = {}) {
        this.getConfig(opts);
    }

    async getConfig(opts) {
        const result = await fetchPost(`${opts.serverUrl}/agent/getSTSToken`, {}, opts.token);
        if (result && result.statusCode === 200) {
            UploadFile.instance._directory = result.response.directory;
            UploadFile.instance.Client = new OSS({
                accessKeyId: result.response.accessKeyId,
                accessKeySecret: result.response.accessKeySecret,
                stsToken: result.response.securityToken,
                endpoint: result.response.endPoint,
                bucket: result.response.bucket,
            });
        }
    }

    upload(blob, cb) {
        let files = [];
        console.log('OSS: ', UploadFile.instance.Client);
        UploadFile.instance.Client.put(`${UploadFile.instance._directory}/${this.guid()}`, blob)
            .then((result) => {
                console.log('upload file: ', result);
                cb && cb(result);
            })
            .catch((err) => {
                console.log('upload file err: ', err);
            })
    }

    S4() {
        return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    }

    guid() {
        return (this.S4()+this.S4()+"-"+this.S4()+"-"+this.S4()+"-"+this.S4()+"-"+this.S4()+this.S4()+this.S4());
    }
}