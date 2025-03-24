(function () {
  const style = document.createElement('style');
  style.innerHTML = `
    #face-widget-modal {
      position: fixed; top: 0; left: 0;
      width: 100vw; height: 100vh;
      background: rgba(0, 0, 0, 0.6); z-index: 9999;
      display: flex; align-items: center; justify-content: center;
    }
    #face-widget-box {
      background: white; padding: 20px; border-radius: 10px;
      text-align: center; width: 400px;
      position: relative;
    }
    video { width: 100%; border-radius: 10px; }
  `;
  document.head.appendChild(style);

  const modal = document.createElement('div');
  modal.id = 'face-widget-modal';
  modal.innerHTML = `
    <div id="face-widget-box">
      <button id="fw-close" style="position: absolute; top: 10px; right: 15px; background: none; border: none; font-size: 18px; cursor: pointer;">❌</button>
      <h3>Face Verification</h3>
      <video id="fw-video" autoplay playsinline></video>
      <button id="fw-start">Verify Face</button>
      <p id="fw-status">Waiting to start...</p>
    </div>
  `;
  document.body.appendChild(modal);

  const video = document.getElementById('fw-video');
  const status = document.getElementById('fw-status');
  const startBtn = document.getElementById('fw-start');
  const closeBtn = document.getElementById('fw-close');

  let stream;
  navigator.mediaDevices.getUserMedia({ video: true }).then(s => {
    stream = s;
    video.srcObject = s;
  });

  const captureImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg');
  };

  startBtn.onclick = async () => {
    status.textContent = '📸 Capturing...';
    const image = captureImage();

    const mode = window.FaceWidgetConfig?.mode || 'verify'; // 'register' or 'verify'
    const name = window.FaceWidgetConfig?.name;

    if (!name) return alert("⚠️ Please pass `name` in FaceWidgetConfig");

    const endpoint =
      mode === 'register'
        ? 'https://cc-faceverification.onrender.com/api/register-student'
        : 'https://cc-faceverification.onrender.com/api/verify-face';

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image, name }),
    });

    const data = await res.json();
    if (data.match || data.status === 'success') {
      status.textContent = '✅ Verified!';
      stream.getTracks().forEach(track => track.stop());
      setTimeout(() => modal.remove(), 1500);
      window.dispatchEvent(new Event('FaceVerified'));
    } else {
      status.textContent = '❌ Verification failed!';
    }
  };

  closeBtn.onclick = () => {
    if (stream) stream.getTracks().forEach(track => track.stop());
    modal.remove();
  };
})();
