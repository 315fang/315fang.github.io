/**
 * 音乐播放器脚本
 * 从footer.ejs抽离以提升缓存效率
 */

(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', function() {
        const musicPlayer = document.getElementById('music-player');
        const playBtn = document.getElementById('play-btn');
        const musicCover = document.getElementById('music-cover');
        const progressBar = document.getElementById('progress-bar');
        const currentTimeDisplay = document.getElementById('current-time');
        const totalTimeDisplay = document.getElementById('total-time');
        const volumeBtn = document.getElementById('volume-btn');
        const volumeControl = document.getElementById('volume-control');

        // 如果播放器元素不存在，直接返回
        if (!musicPlayer) {
            return;
        }

        let isPlaying = false;

        /**
         * 切换播放/暂停状态
         */
        function togglePlay() {
            if (isPlaying) {
                musicPlayer.pause();
                if (playBtn) playBtn.innerHTML = '<i class="fas fa-play"></i>';
                if (musicCover) musicCover.style.animationPlayState = 'paused';
            } else {
                musicPlayer.play();
                if (playBtn) playBtn.innerHTML = '<i class="fas fa-pause"></i>';
                if (musicCover) musicCover.style.animationPlayState = 'running';
            }
            isPlaying = !isPlaying;
        }

        /**
         * 更新进度条
         */
        function updateProgress() {
            const { duration, currentTime } = musicPlayer;
            const progressPercent = (currentTime / duration) * 100;
            if (progressBar) progressBar.value = progressPercent;
            if (currentTimeDisplay) currentTimeDisplay.textContent = formatTime(currentTime);
            if (!isNaN(duration) && totalTimeDisplay) {
                totalTimeDisplay.textContent = formatTime(duration);
            }
        }

        /**
         * 格式化时间为 mm:ss
         * @param {number} seconds - 秒数
         * @returns {string} 格式化后的时间
         */
        function formatTime(seconds) {
            const minutes = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return minutes + ':' + (secs < 10 ? '0' : '') + secs;
        }

        /**
         * 切换静音状态
         */
        function toggleMute() {
            musicPlayer.muted = !musicPlayer.muted;
            if (volumeBtn) {
                volumeBtn.innerHTML = musicPlayer.muted 
                    ? '<i class="fas fa-volume-mute"></i>' 
                    : '<i class="fas fa-volume-up"></i>';
            }
        }

        /**
         * 设置音量
         */
        function setVolume() {
            if (!volumeControl) return;
            musicPlayer.volume = volumeControl.value / 100;
            if (volumeBtn) {
                if (musicPlayer.volume === 0) {
                    volumeBtn.innerHTML = '<i class="fas fa-volume-off"></i>';
                } else if (musicPlayer.volume < 0.5) {
                    volumeBtn.innerHTML = '<i class="fas fa-volume-down"></i>';
                } else {
                    volumeBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
                }
            }
        }

        /**
         * 设置播放位置
         */
        function setProgress() {
            const duration = musicPlayer.duration;
            if (progressBar && !isNaN(duration)) {
                musicPlayer.currentTime = (progressBar.value / 100) * duration;
            }
        }

        // 绑定事件监听器
        if (playBtn) playBtn.addEventListener('click', togglePlay);
        if (musicPlayer) musicPlayer.addEventListener('timeupdate', updateProgress);
        if (progressBar) progressBar.addEventListener('input', setProgress);
        if (volumeBtn) volumeBtn.addEventListener('click', toggleMute);
        if (volumeControl) volumeControl.addEventListener('input', setVolume);

        // 初始化音量
        if (musicPlayer) {
            musicPlayer.volume = volumeControl ? volumeControl.value / 100 : 0.5;
            musicPlayer.addEventListener('loadedmetadata', function() {
                if (!isNaN(musicPlayer.duration) && totalTimeDisplay) {
                    totalTimeDisplay.textContent = formatTime(musicPlayer.duration);
                }
            });
        }
    });
})();
