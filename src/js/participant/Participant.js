import onfire from 'onfire.js';
export default class Participant {
    static getInstance() {
        if (!Participant.instance || !Participant.instance instanceof this) {
            Participant.instance = new this;
            Participant.instance_participantMap = new Map();
        }
        return Participant.instance;
    }

    addParticipant(call, cid, pid) {
        if (!Participant.instance_participantMap.get(cid)) {
            Participant.instance_participantMap.set(cid, pid);
            onfire.fire('onJoinRoom', call);
        }
    }

    getParticipant(cid) {
        return Participant.instance_participantMap.get(cid);
    }

    removeParticipant(cid) {
        Participant.instance_participantMap.get(cid) && Participant.instance_participantMap.delete(cid);
    }

    clearParticipants() {
        Participant.instance_participantMap.clear();
    }
}