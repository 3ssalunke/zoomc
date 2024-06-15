"use client";

import { useRef, useState } from "react";
import SimplePeer from "simple-peer";

export default function VideoChat() {
  //   const [stream, setStream] = useState<MediaStream | null>(null);
  const [peer, setPeer] = useState<SimplePeer.Instance>();

  const userVideoRef = useRef<HTMLVideoElement>(null);
  //   const peerVidoeRef = useRef<HTMLVideoElement>(null);

  const startPeer = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        // setStream(stream);
        if (userVideoRef.current) {
          userVideoRef.current.srcObject = stream;
        }
      });

    // const newPeer = new SimplePeer({
    //   initiator: true,
    //   trickle: false,
    // });

    // newPeer.on("signal", (data) => {
    //   console.log(data);
    // });

    // newPeer.on("stream", (stream) => {
    //   if (videoRef.current?.srcObject) {
    //     videoRef.current.srcObject = stream;
    //   }
    // });

    // setPeer(newPeer);
  };

  return (
    <div>
      <button onClick={startPeer}>Start video chat</button>
      <video ref={userVideoRef} autoPlay />
    </div>
  );
}
