document.addEventListener('DOMContentLoaded', function() {
    const audioPlayer = document.getElementById('audioPlayer');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const playPauseIcon = playPauseBtn.querySelector('i');
    const volumeSlider = document.getElementById('volumeSlider');
    const seekBar = document.getElementById('seekBar');
    const progress = document.getElementById('progress');

    // 确保音频元素已加载
    audioPlayer.addEventListener('loadedmetadata', function() {
        // 设置初始音量
        audioPlayer.volume = volumeSlider.value / 100;
    });

    // 播放/暂停功能
    playPauseBtn.addEventListener('click', function() {
        if (audioPlayer.paused) {
            const playPromise = audioPlayer.play();
            if (playPromise !== undefined) {
                playPromise.then(_ => {
                    playPauseIcon.classList.remove('fa-play');
                    playPauseIcon.classList.add('fa-pause');
                }).catch(error => {
                    console.error('播放失败:', error);
                });
            }
        } else {
            audioPlayer.pause();
            playPauseIcon.classList.remove('fa-pause');
            playPauseIcon.classList.add('fa-play');
        }
    });

    // 音量控制
    volumeSlider.addEventListener('input', function() {
        const volume = this.value / 100;
        audioPlayer.volume = volume;
        // 保存音量设置到本地存储
        localStorage.setItem('playerVolume', volume);
    });

    // 从本地存储加载音量设置
    const savedVolume = localStorage.getItem('playerVolume');
    if (savedVolume !== null) {
        audioPlayer.volume = parseFloat(savedVolume);
        volumeSlider.value = parseFloat(savedVolume) * 100;
    }

    // 进度条更新
    audioPlayer.addEventListener('timeupdate', function() {
        if (!isNaN(audioPlayer.duration)) {
            const percentage = (audioPlayer.currentTime / audioPlayer.duration) * 100;
            progress.style.width = percentage + '%';
            seekBar.value = percentage;
        }
    });

    // 进度条拖动
    seekBar.addEventListener('input', function() {
        if (!isNaN(audioPlayer.duration)) {
            const time = (audioPlayer.duration / 100) * this.value;
            audioPlayer.currentTime = time;
        }
    });

    // 错误处理
    audioPlayer.addEventListener('error', function(e) {
        console.error('音频播放错误:', e);
        playPauseIcon.classList.remove('fa-pause');
        playPauseIcon.classList.add('fa-play');
    });

    // 音频结束时重置播放按钮
    audioPlayer.addEventListener('ended', function() {
        playPauseIcon.classList.remove('fa-pause');
        playPauseIcon.classList.add('fa-play');
    });
});