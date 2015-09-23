/*
 * Video.js Hotkeys
 * https://github.com/ctd1500/videojs-hotkeys
 *
 * Copyright (c) 2015 Chris Dougherty
 * Licensed under the Apache-2.0 license.
 */

(function(window, videojs) {
    'use strict';

    window['videojs_hotkeys'] = { version: "0.2.7" };

    // Key combination 
    function getKeyCombination(keyboardEvent) {
        var ewhich = keyboardEvent.which;

        if (ewhich === 32) {
            return 'spacebar';
        }

        if (ewhich === 37) {
            return 'leftArrow';
        }

        if (ewhich === 39) {
            return 'rightArrow';
        }

        if (ewhich === 40) {
            return 'downArrow';
        }

        if (ewhich === 38) {
            return 'upArrow';
        }

        if (ewhich === 77) {
            return 'mKey';
        }

        if (ewhich === 70) {
            return 'fKey';
        }

        if ((ewhich > 47 && ewhich < 59) || (ewhich > 95 && ewhich < 106)) {
            var sub = 48;
            if (ewhich > 95) {
                sub = 96;
            }
            var number = ewhich - sub;
            return number + 'Key';
        }

        // Toggle Fullscreen with the F key and CTRL + ENTER
        if (keyboardEvent.ctrlKey && ewhich === 13) {
            return 'ctrlEnter';
        }

        return null;
    }

    var hotkeys = function(options) {
        var player = this;
        var def_options = {
            volumeStep: 0.1,
            seekStep: 5,
            enableMute: true,
            enableFullscreen: true,
            enableNumbers: true,
            enableJogStyle: false,
            alwaysCaptureHotkeys: false
        };

        options = videojs.util.mergeOptions(def_options, options || {});

        var volumeStep = options.volumeStep;
        var seekStep = options.seekStep;
        var enableMute = options.enableMute;
        var enableFull = options.enableFullscreen;
        var enableNumbers = options.enableNumbers;
        var enableJogStyle = options.enableJogStyle;
        var alwaysCaptureHotkeys = options.alwaysCaptureHotkeys;

        var handlers = {
            togglePlay: function(event) {
                event.preventDefault();
                if (alwaysCaptureHotkeys) {
                    // Prevent control activation with space
                    event.stopPropagation();
                }

                if (player.paused()) {
                    player.play();
                } else {
                    player.pause();
                }
            },

            toggleMute: function(event) {
                if (enableMute) {
                    player.muted(!player.muted());
                }
            },

            toggleFullscreen: function(event) {
                if (enableFull) {
                    if (player.isFullscreen()) {
                        player.exitFullscreen();
                    } else {
                        player.requestFullscreen();
                    }
                }
            },

            seekByNumbers: function(event, keyCombination) {
                event.preventDefault();
                var number = keyCombination.charAt(0);
                player.currentTime(player.duration() * number * 0.1);
            },

            seekBack: function(event) {
                event.preventDefault();
                var curTime = player.currentTime() - seekStep;
                // The flash player tech will allow you to seek into negative
                // numbers and break the seekbar, so try to prevent that.
                if (curTime < 0) {
                    curTime = 0;
                }
                player.currentTime(curTime);
            },

            seekForward: function(event) {
                event.preventDefault();
                player.currentTime(player.currentTime() + seekStep);
            },

            volumeDown: function(event) {
                event.preventDefault();
                if (!enableJogStyle) {
                    player.volume(player.volume() - volumeStep);
                } else {
                    handlers.seekBack(event);
                }
            },

            volumeUp: function(event) {
                event.preventDefault();
                if (!enableJogStyle) {
                    player.volume(player.volume() + volumeStep);
                } else {
                    player.currentTime(player.currentTime() + 1);
                }
            }
        };

        // Defining the handlers for the Keycombinations
        var actions = {
            // Spacebar toggles play/pause
            'spacebar':   handlers.togglePlay,
            
            // Seek back with Left Arrow
            'leftArrow':  handlers.seekBack,
            
            // Seek forward with Right Arrow
            'rightArrow': handlers.seekForward,
            
            // Volume down with Down Arror
            'downArrow':  handlers.volumeDown,
            
            // Volume up with Up Arror
            'upArrow':    handlers.volumeUp,

            // Toggle Mute with the M key
            'mKey':       handlers.toggleMute,

            // Toggle Fullscreen with the F key
            'fKey':       handlers.toggleFullscreen,

            // Number keys from 0-9 skip to a percentage of the video. 0 is 0% and 9 is 90%
            '0Key':       handlers.seekByNumbers,
            '1Key':       handlers.seekByNumbers,
            '2Key':       handlers.seekByNumbers,
            '3Key':       handlers.seekByNumbers,
            '4Key':       handlers.seekByNumbers,
            '5Key':       handlers.seekByNumbers,
            '6Key':       handlers.seekByNumbers,
            '7Key':       handlers.seekByNumbers,
            '8Key':       handlers.seekByNumbers,
            '9Key':       handlers.seekByNumbers,

            // Toggle Fullscreen with CTRL + ENTER combination
            'ctrlEnter':  handlers.toggleFullscreen
        };

        // Set default player tabindex to handle keydown and doubleclick events
        if (!player.el().hasAttribute('tabIndex')) {
            player.el().setAttribute('tabIndex', '-1');
        }

        if (alwaysCaptureHotkeys) {
            player.one('play', function() {
                player.el().focus(); // Fixes the .vjs-big-play-button handing focus back to body instead of the player
            });
        }

        player.on('play', function() {
            // Fix allowing the YouTube plugin to have hotkey support.

            var ifblocker = player.el().querySelector('.iframeblocker');
            if (ifblocker && ifblocker.style.display === '') {
                ifblocker.style.display = "block";
                ifblocker.style.bottom = "39px";
            }
        });

        var keyDown = function keyDown(event) {

            var keyCombination = getKeyCombination(event);

            // When controls are disabled, hotkeys will be disabled as well
            if (player.controls()) {

                // Don't catch keys if any control buttons are focused, unless alwaysCaptureHotkeys is true
                var activeEl = document.activeElement;
                if (alwaysCaptureHotkeys ||
                    activeEl == player.el() ||
                    activeEl == player.el().querySelector('.vjs-tech') ||
                    activeEl == player.el().querySelector('.vjs-control-bar') ||
                    activeEl == player.el().querySelector('.iframeblocker')) {

                    if (actions[keyCombination]) {
                        // Exec action
                        actions[keyCombination](event, keyCombination);
                    }
                }
            }
        };

        var doubleClick = function doubleClick(event) {
            // When controls are disabled, hotkeys will be disabled as well
            if (player.controls()) {

                // Don't catch clicks if any control buttons are focused
                var activeEl = event.relatedTarget || event.toElement || document.activeElement;
                if (activeEl == player.el() ||
                    activeEl == player.el().querySelector('.vjs-tech') ||
                    activeEl == player.el().querySelector('.iframeblocker')) {

                    // Toggle Fullscreen
                    actions.toggleFullscreen(event);
                }
            }
        };

        player.on('keydown', keyDown);
        player.on('dblclick', doubleClick);

        return this;
    };

    videojs.plugin('hotkeys', hotkeys);

})(window, window.videojs);
