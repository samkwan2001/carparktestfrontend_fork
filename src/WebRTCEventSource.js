class WebRTCEventSource extends EventTarget {
    constructor(url, options = {}) {
        super();
        this.url = url; // 对应你的 Vercel API 基础路径，例如 "" 或 "https://your-vercel.app"
        this.roomId = options.roomId || "1234567890abcdef12345678";
        this.clientId = options.clientId||"client_" + Math.floor(Math.random() * 10000);
        this.connected = false;
        // 标准 EventSource 状态常量
        this.CONNECTING = 0;
        this.OPEN = 1;
        this.CLOSED = 2;
        this.readyState = this.CONNECTING;

        // 原生回调槽位初始化
        this.onopen = null;
        this.onmessage = null;
        this.onerror = null;

        // 内部 WebRTC 引用
        this.pc = null;
        this.dataChannel = null;
        this.pollingInterval = null;

        // 启动底层 WebRTC 握手流
        this._initWebRTC();
    }

    async _initWebRTC() {
        try {
            this.pc = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });

            // 1. 核心：监听远端（本地后端）主动创建的 DataChannel
            this.pc.ondatachannel = (event) => {
                this.dataChannel = event.channel;
                this.connected= true;
                this.dataChannel.onopen = () => {
                    this.readyState = this.OPEN;
                    
                    // 触发标准 onopen 事件
                    const openEvent = new Event('open');
                    if (typeof this.onopen === 'function') this.onopen(openEvent);
                    this.dispatchEvent(openEvent);
                };

                this.dataChannel.onmessage = (e) => {
                    // 模拟原生 EventSource 的 MessageEvent
                    // 假设后端发来的是纯字符串，或者符合 {event, data} 的 JSON
                    console.log(e);
                    console.log(e.data);
                    let parsedData = e.data;
                    let eventType = 'message';

                    try {
                        // 尝试兼容 SSE 格式（如果后端发来的是 JSON 且包含 event 字段）
                        const json = JSON.parse(e.data);
                        if (json.event && json.data) {
                            eventType = json.event;
                            parsedData = typeof json.data === 'object' ? JSON.stringify(json.data) : json.data;
                        }
                    } catch (err) {
                        // 不是 JSON 则作为普通文本处理
                    }

                    const msgEvent = new MessageEvent(eventType, {
                        data: parsedData,
                        origin: this.url,
                        lastEventId: ''
                    });

                    // 触发标准 onmessage 回调及 addEventListener 监听
                    if (eventType === 'message' && typeof this.onmessage === 'function') {
                        this.onmessage(msgEvent);
                    }
                    this.dispatchEvent(msgEvent);
                };

                this.dataChannel.onclose = () => {
                    this._handleError();
                };
            };

            // 2. 收集本地 ICE 候选并提交给 Vercel
            this.pc.onicecandidate = async (event) => {
                if (event.candidate) {
                    await fetch(`${this.url}/api/submit-client-signal`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            roomId: this.roomId,
                            clientId: this.clientId,
                            candidate: event.candidate.toJSON()
                        })
                    });
                }
            };

            // 3. 向 Vercel 注册自己，唤醒本地后端生成 Offer
            await fetch(`${this.url}/api/register-client`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomId: this.roomId, clientId: this.clientId })
            });

            // 4. 开启轮询以获取专属 Offer 和后端的 ICE
            const connectWebrtc = async () => {
                
                try {
                    const res = await fetch(`${this.url}/api/get-room?roomId=${this.roomId}&clientId=${this.clientId}`);
                    if (!res.ok) return;
                    const roomData = await res.json();

                    // 应用专属 Offer 并回复 Answer
                    if (roomData.offer && !this.pc.currentRemoteDescription) {
                        await this.pc.setRemoteDescription(new RTCSessionDescription(roomData.offer));
                        const answer = await this.pc.createAnswer();
                        await this.pc.setLocalDescription(answer);

                        await fetch(`${this.url}/api/submit-client-signal`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                roomId: this.roomId,
                                clientId: this.clientId,
                                answer: { type: answer.type, sdp: answer.sdp }
                            })
                        });
                    }

                    // 持续应用后端的 ICE
                    if (roomData.backendCandidates) {
                        for (const cand of roomData.backendCandidates) {
                            try { await this.pc.addIceCandidate(cand); } catch (e) {}
                        }
                    }
                    return this.connected;
                } catch (err) { }
            }
            const re =async ()=> {
                if (!this.connected && !await connectWebrtc()) {
                    console.log("retry at 1500 millis later")
                    setTimeout(re, 1500);
                }
                
            }

            re()

        } catch (err) {
            this._handleError(err);
        }
    }

    _handleError(err) {
        if (this.readyState === this.CLOSED) return;
        this.readyState = this.CLOSED;
        clearInterval(this.pollingInterval);

        const errorEvent = new Event('error');
        errorEvent.error = err;
        if (typeof this.onerror === 'function') this.onerror(errorEvent);
        this.dispatchEvent(errorEvent);
        
        this.close();
    }

    // 标准 EventSource 的 close 方法
    close() {
        this.readyState = this.CLOSED;
        clearInterval(this.pollingInterval);
        if (this.dataChannel) {
            try { this.dataChannel.close(); } catch(e){}
        }
        if (this.pc) {
            try { this.pc.close(); } catch(e){}
        }
    }
}
export {WebRTCEventSource};