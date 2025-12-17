document.addEventListener('DOMContentLoaded', function() {
    const logoTrigger = document.getElementById('logo-audio-trigger');
    const audioPath = '/medias/voice.mp3';
    let audio = null;

    // 预加载音频文件
    function preloadAudio() {
        audio = new Audio(audioPath);
        audio.preload = 'auto';
    }

    // 处理点击事件
    function handleLogoClick() {
        if (!audio) {
            preloadAudio();
        }
        
        // 如果音频正在播放，重置并重新播放
        if (!audio.paused) {
            audio.currentTime = 0;
        }
        
        // 播放音频
        audio.play().catch(function(error) {
            console.log('播放音频失败:', error);
        });
    }

    // 绑定点击事件
    if (logoTrigger) {
        logoTrigger.style.cursor = 'pointer';
        logoTrigger.addEventListener('click', handleLogoClick);
        preloadAudio(); // 预加载音频
    }
});