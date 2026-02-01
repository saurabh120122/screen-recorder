"use strict";
// Type definitions
// Wrap everything in IIFE to avoid exports issue
(function () {
    const selectSourceBtn = document.getElementById('selectSourceBtn');
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const webcamToggle = document.getElementById('webcamToggle');
    const screenVideo = document.getElementById('screenVideo');
    const webcamVideo = document.getElementById('webcamVideo');
    const sourceList = document.getElementById('sourceList');
    const timerDisplay = document.getElementById('timer');
    let screenStream = null;
    let webcamStream = null;
    let screenRecorder = null;
    let webcamRecorder = null;
    let screenChunks = [];
    let webcamChunks = [];
    let sessionUUID = null;
    let timerInterval = null;
    let recordingStartTime = null;
    selectSourceBtn.onclick = async () => {
        const sources = await window.electronAPI.getSources();
        sourceList.innerHTML = '';
        sourceList.style.display = 'block';
        sources.forEach(source => {
            const div = document.createElement('div');
            div.className = 'source-item';
            div.textContent = source.name;
            div.onclick = () => selectSource(source);
            sourceList.appendChild(div);
        });
    };
    async function selectSource(source) {
        sourceList.style.display = 'none';
        const constraints = {
            audio: false,
            video: {
                mandatory: {
                    chromeMediaSource: 'desktop',
                    chromeMediaSourceId: source.id
                }
            }
        };
        try {
            screenStream = await navigator.mediaDevices.getUserMedia(constraints);
            screenVideo.srcObject = screenStream;
            screenVideo.play();
            selectSourceBtn.textContent = `Selected: ${source.name}`;
            startBtn.disabled = false;
        }
        catch (error) {
            console.error('Error selecting source:', error);
            alert('Failed to capture screen');
        }
    }
    async function setupWebcam() {
        if (!webcamToggle.checked)
            return;
        try {
            webcamStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            webcamVideo.srcObject = webcamStream;
            webcamVideo.play();
        }
        catch (error) {
            console.error('Webcam error:', error);
            alert('Failed to access webcam');
            webcamToggle.checked = false;
        }
    }
    startBtn.onclick = async () => {
        sessionUUID = window.electronAPI.generateUUID();
        screenChunks = [];
        webcamChunks = [];
        if (webcamToggle.checked) {
            await setupWebcam();
        }
        if (screenStream) {
            screenRecorder = new MediaRecorder(screenStream, {
                mimeType: 'video/webm; codecs=vp9'
            });
            screenRecorder.ondataavailable = (e) => {
                if (e.data.size > 0)
                    screenChunks.push(e.data);
            };
            screenRecorder.onstop = handleScreenStop;
            screenRecorder.start();
        }
        if (webcamStream) {
            webcamRecorder = new MediaRecorder(webcamStream, {
                mimeType: 'video/webm; codecs=vp9'
            });
            webcamRecorder.ondataavailable = (e) => {
                if (e.data.size > 0)
                    webcamChunks.push(e.data);
            };
            webcamRecorder.onstop = handleWebcamStop;
            webcamRecorder.start();
        }
        startBtn.disabled = true;
        stopBtn.disabled = false;
        selectSourceBtn.disabled = true;
        webcamToggle.disabled = true;
        recordingStartTime = Date.now();
        startTimer();
    };
    stopBtn.onclick = () => {
        if (screenRecorder && screenRecorder.state !== 'inactive') {
            screenRecorder.stop();
        }
        if (webcamRecorder && webcamRecorder.state !== 'inactive') {
            webcamRecorder.stop();
        }
        if (screenStream) {
            screenStream.getTracks().forEach(track => track.stop());
        }
        if (webcamStream) {
            webcamStream.getTracks().forEach(track => track.stop());
        }
        startBtn.disabled = true;
        stopBtn.disabled = true;
        stopTimer();
    };
    async function handleScreenStop() {
        const blob = new Blob(screenChunks, { type: 'video/webm' });
        const folderPath = await window.electronAPI.saveRecording(blob, sessionUUID, 'screen.webm');
        if (!webcamToggle.checked) {
            alert(`Recording saved to: ${folderPath}`);
            resetUI();
        }
    }
    async function handleWebcamStop() {
        const blob = new Blob(webcamChunks, { type: 'video/webm' });
        const folderPath = await window.electronAPI.saveRecording(blob, sessionUUID, 'webcam.webm');
        alert(`Recording saved to: ${folderPath}`);
        resetUI();
    }
    function startTimer() {
        timerInterval = setInterval(() => {
            const elapsed = Date.now() - recordingStartTime;
            const seconds = Math.floor((elapsed / 1000) % 60);
            const minutes = Math.floor((elapsed / (1000 * 60)) % 60);
            const hours = Math.floor(elapsed / (1000 * 60 * 60));
            timerDisplay.textContent =
                `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }, 1000);
    }
    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
        }
    }
    function resetUI() {
        selectSourceBtn.disabled = false;
        webcamToggle.disabled = false;
        selectSourceBtn.textContent = 'Choose Screen/Window';
        startBtn.disabled = true;
        screenVideo.srcObject = null;
        webcamVideo.srcObject = null;
        timerDisplay.textContent = '00:00:00';
    }
    document.addEventListener('click', (e) => {
        if (!sourceList.contains(e.target) && e.target !== selectSourceBtn) {
            sourceList.style.display = 'none';
        }
    });
})();
