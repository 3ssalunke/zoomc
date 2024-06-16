"use client";

import { useEffect, useRef, useState } from "react";
import SimplePeer from "simple-peer";

export default function VideoChat() {
  const [stream, setStream] = useState<MediaStream>();
  const [peer, setPeer] = useState<SimplePeer.Instance>();
  const [callAccepted, setCallAccepted] = useState(false);
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState(null);
  const [ws, setWs] = useState<WebSocket | null>(null);

  const userVideoRef = useRef<HTMLVideoElement>(null);
  const peerVidoeRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setStream(stream);
        if (userVideoRef.current) {
          userVideoRef.current.srcObject = stream;
        }
      });

    const websocket = new WebSocket("http://localhost:8000/ws");
    websocket.onopen = () => console.log("websocker server connected");
    websocket.onmessage = (message) => {
      const data = JSON.parse(message.data);
      switch (data.type) {
        case "callUser":
          setReceivingCall(true);
          setCaller(data.from);
          setCallerSignal(data.signal);
          break;
        case "callAccepted":
          setCallAccepted(true);
          if (peer) peer.signal(data.signal);
          break;
        default:
          break;
      }
    };

    setWs(websocket);
  }, [peer]);

  const callPeer = (id: string) => {
    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream: stream,
    });

    peer.on("signal", (data) => {
      ws?.send(
        JSON.stringify({
          type: "callUser",
          data: JSON.stringify({
            userToCall: id,
            signal: JSON.stringify(data),
            from: Math.ceil(Math.random() * 10000).toString(),
          }),
        })
      );
    });

    peer.on("stream", (stream) => {
      if (peerVidoeRef.current) {
        peerVidoeRef.current.srcObject = stream;
      }
    });

    setPeer(peer);
  };

  const acceptCall = () => {
    setCallAccepted(true);
    const peer = new SimplePeer({
      initiator: false,
      trickle: false,
      stream: stream,
    });

    peer.on("signal", (data) => {
      ws?.send(
        JSON.stringify({
          type: "acceptCall",
          data: JSON.stringify({
            signal: JSON.stringify(data),
            to: caller,
          }),
        })
      );
    });

    peer.on("stream", (stream) => {
      if (peerVidoeRef.current) {
        peerVidoeRef.current.srcObject = stream;
      }
    });

    peer.signal(callerSignal!);
    setPeer(peer);
  };

  return (
    <div>
      <button onClick={() => callPeer("some-random-id")}>
        Start video Call
      </button>
      <div>{stream && <video ref={userVideoRef} autoPlay />}</div>
      <div>{callAccepted && <video ref={peerVidoeRef} autoPlay />}</div>
      <div>
        {receivingCall && !callAccepted ? (
          <div>
            <h1>{caller} is calling...</h1>
            <button onClick={acceptCall}>Accept</button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
