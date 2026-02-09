document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            const isMenuOpen = navLinks.classList.toggle('active');
            hamburger.setAttribute('aria-expanded', isMenuOpen ? 'true' : 'false');
        });

        document.querySelectorAll('.nav-links a').forEach((link) => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
            });
        });
    }

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', (event) => {
            const targetSelector = anchor.getAttribute('href');
            if (!targetSelector || targetSelector === '#') {
                return;
            }

            const target = document.querySelector(targetSelector);
            if (!target) {
                return;
            }

            event.preventDefault();
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        });
    });

    initializeSignupValidation();
    initializeApiForms();
    initializeGoogleSignIn();
    initializeScrollVideoBackground();
    initializeHomeMap();
    initializeScrollReveal();
    initializeDestinationSliders();
});

function initializeSignupValidation() {
    const signupForm = document.querySelector('.signup-form');
    if (!signupForm) {
        return;
    }

    signupForm.addEventListener('submit', (event) => {
        const passwordInput = document.getElementById('signup-password');
        const confirmInput = document.getElementById('confirm-password');
        if (!passwordInput || !confirmInput) {
            return;
        }

        if (passwordInput.value !== confirmInput.value) {
            event.preventDefault();
            setFormStatus(signupForm, 'Passwords do not match. Please check and try again.', 'error');
            confirmInput.focus();
            return;
        }

        setFormStatus(signupForm, '', '');
    });
}

function initializeGoogleSignIn() {
    const googleSlots = document.querySelectorAll('[data-google-signin]');
    if (!googleSlots.length) {
        return;
    }

    googleSlots.forEach((googleSlot) => {
        const clientId = googleSlot.getAttribute('data-google-client-id');
        const mode = (googleSlot.getAttribute('data-google-mode') || 'signup').toLowerCase();
        const modeText = mode === 'signin' ? 'sign-in' : 'sign-up';
        const sourceFile = mode === 'signin' ? 'signin.html' : 'signup.html';

        if (!clientId || clientId.indexOf('YOUR_GOOGLE_CLIENT_ID') !== -1) {
            googleSlot.innerHTML = `<p class="google-message">Add your Google OAuth Client ID in ${sourceFile} to enable Google ${modeText}.</p>`;
            return;
        }

        waitForGoogleLibrary(googleSlot, clientId, mode, 0);
    });
}

function waitForGoogleLibrary(googleSlot, clientId, mode, attempt) {
    if (window.google && google.accounts && google.accounts.id) {
        if (window.__travelBaadshaGoogleClientId !== clientId) {
            google.accounts.id.initialize({
                client_id: clientId,
                callback: handleGoogleCredentialResponse
            });
            window.__travelBaadshaGoogleClientId = clientId;
        }

        google.accounts.id.renderButton(googleSlot, {
            theme: 'outline',
            size: 'large',
            text: mode === 'signin' ? 'signin_with' : 'signup_with',
            shape: 'pill',
            width: 320
        });
        return;
    }

    if (attempt >= 10) {
        googleSlot.innerHTML = '<p class="google-message">Google script did not load. Refresh and try again.</p>';
        return;
    }

    window.setTimeout(() => {
        waitForGoogleLibrary(googleSlot, clientId, mode, attempt + 1);
    }, 300);
}

function handleGoogleCredentialResponse(response) {
    const profile = parseJwt(response.credential);
    const name = profile && profile.name ? profile.name : 'traveler';
    alert('Google sign-in successful for ' + name + '. Connect this callback to your backend to create the account.');
}

function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        if (!base64Url) {
            return null;
        }

        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((char) => '%' + ('00' + char.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );

        return JSON.parse(jsonPayload);
    } catch (error) {
        return null;
    }
}

function initializeApiForms() {
    const apiBase = window.TRAVEL_BADSHA_API_BASE || '';
    const forms = document.querySelectorAll('form[data-api-endpoint]');
    if (!forms.length) {
        return;
    }

    forms.forEach((form) => {
        form.addEventListener('submit', async (event) => {
            if (event.defaultPrevented) {
                return;
            }

            event.preventDefault();
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const endpoint = form.getAttribute('data-api-endpoint');
            const method = (form.getAttribute('data-api-method') || 'POST').toUpperCase();
            if (!endpoint) {
                return;
            }

            const submitButton = form.querySelector('button[type="submit"]');
            const payload = Object.fromEntries(new FormData(form).entries());
            const url = apiBase + endpoint;

            if (submitButton) {
                submitButton.disabled = true;
            }
            setFormStatus(form, 'Submitting...', '');

            try {
                const response = await fetch(url, {
                    method,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify(payload)
                });

                let data = null;
                try {
                    data = await response.json();
                } catch (parseError) {
                    data = null;
                }

                if (!response.ok) {
                    const errorMessage = data && data.message ? data.message : 'Request failed. Please try again.';
                    throw new Error(errorMessage);
                }

                const successMessage = data && data.message ? data.message : 'Request submitted successfully.';
                setFormStatus(form, successMessage, 'success');
                form.reset();
            } catch (error) {
                setFormStatus(form, error.message || 'Could not connect to backend endpoint.', 'error');
            } finally {
                if (submitButton) {
                    submitButton.disabled = false;
                }
            }
        });
    });
}

function setFormStatus(form, message, type) {
    const status = form.querySelector('.form-status');
    if (!status) {
        return;
    }

    status.textContent = message || '';
    status.classList.remove('is-error', 'is-success');
    if (type === 'error') {
        status.classList.add('is-error');
    }
    if (type === 'success') {
        status.classList.add('is-success');
    }
}

function initializeScrollVideoBackground() {
    const videoLayer = document.querySelector('.scroll-video-bg');
    const video = document.querySelector('.scroll-bg-media[data-scroll-sync]');
    if (!videoLayer || !video) {
        return;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        videoLayer.style.display = 'none';
        return;
    }

    const root = document.documentElement;
    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
    let targetOffset = 0;
    let renderedOffset = 0;
    let rafId = 0;

    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;

    const ensurePlayback = () => {
        const playPromise = video.play();
        if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(() => {});
        }
    };

    const requestRender = () => {
        if (!rafId) {
            rafId = window.requestAnimationFrame(renderFrame);
        }
    };

    const readScrollProgress = () => {
        const scrollMax = document.documentElement.scrollHeight - window.innerHeight;
        return scrollMax > 0 ? clamp(window.scrollY / scrollMax, 0, 1) : 0;
    };

    const updateTargets = () => {
        const progress = readScrollProgress();
        targetOffset = progress * -24;
        requestRender();
    };

    const renderFrame = () => {
        rafId = 0;
        const delta = targetOffset - renderedOffset;

        if (Math.abs(delta) > 0.02) {
            renderedOffset += delta * 0.08;
        } else {
            renderedOffset = targetOffset;
        }

        root.style.setProperty('--scroll-video-shift-y', `${renderedOffset.toFixed(2)}px`);

        if (Math.abs(targetOffset - renderedOffset) > 0.02) {
            requestRender();
        }
    };

    if (video.readyState >= 2) {
        ensurePlayback();
    } else {
        video.addEventListener('canplay', ensurePlayback, { once: true });
    }

    window.addEventListener('scroll', updateTargets, { passive: true });
    window.addEventListener('resize', updateTargets);
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && rafId) {
            window.cancelAnimationFrame(rafId);
            rafId = 0;
            return;
        }
        ensurePlayback();
        updateTargets();
    });

    updateTargets();
}

function initializeHomeMap() {
    const mapCanvas = document.getElementById('travel-badsha-map');
    if (!mapCanvas) {
        return;
    }

    const lat = Number.parseFloat(mapCanvas.getAttribute('data-lat') || '19.0760');
    const lng = Number.parseFloat(mapCanvas.getAttribute('data-lng') || '72.8777');
    const zoom = Number.parseInt(mapCanvas.getAttribute('data-zoom') || '13', 10);
    const title = mapCanvas.getAttribute('data-title') || 'Travel Baadsha Office';
    const apiKey = mapCanvas.getAttribute('data-google-maps-key') || '';

    if (!apiKey || apiKey.indexOf('YOUR_GOOGLE_MAPS_API_KEY') !== -1) {
        renderMapFallback(mapCanvas, lat, lng);
        return;
    }

    loadGoogleMapsApi(apiKey)
        .then(() => {
            if (!window.google || !google.maps) {
                throw new Error('Google Maps API did not initialize.');
            }

            const center = { lat, lng };
            const map = new google.maps.Map(mapCanvas, {
                center,
                zoom,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false
            });

            new google.maps.Marker({
                position: center,
                map,
                title
            });
        })
        .catch(() => {
            renderMapFallback(mapCanvas, lat, lng);
        });
}

function loadGoogleMapsApi(apiKey) {
    if (window.google && google.maps) {
        return Promise.resolve();
    }

    if (window.__travelBadshaMapsPromise) {
        return window.__travelBadshaMapsPromise;
    }

    window.__travelBadshaMapsPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
            if (window.google && google.maps) {
                resolve();
                return;
            }
            reject(new Error('Google Maps API unavailable.'));
        };
        script.onerror = () => reject(new Error('Could not load Google Maps API.'));
        document.head.appendChild(script);
    });

    return window.__travelBadshaMapsPromise;
}

function renderMapFallback(mapCanvas, lat, lng) {
    const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}&z=14&output=embed`;
    mapCanvas.innerHTML = `
        <div class="map-fallback">
            <iframe src="${mapUrl}" title="Travel Baadsha location fallback map" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
        </div>
    `;
}

function initializeScrollReveal() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    const revealTargets = new Set();
    const observerSupported = 'IntersectionObserver' in window;
    const revealObserver = observerSupported
        ? new IntersectionObserver(
            (entries, observer) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) {
                        return;
                    }
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                });
            },
            {
                threshold: 0.16,
                rootMargin: '0px 0px -8% 0px'
            }
        )
        : null;

    const registerReveal = (element, options = {}) => {
        const delay = options.delay || 0;
        const distance = options.distance || 24;
        const scale = options.scale || 1;

        if (!element || revealTargets.has(element)) {
            return;
        }

        revealTargets.add(element);
        element.classList.add('reveal');
        element.style.setProperty('--reveal-delay', `${delay}ms`);
        element.style.setProperty('--reveal-distance', `${distance}px`);
        element.style.setProperty('--reveal-scale', String(scale));

        if (revealObserver) {
            revealObserver.observe(element);
        } else {
            element.classList.add('is-visible');
        }
    };

    document.querySelectorAll('[data-reveal]').forEach((element) => {
        registerReveal(element, {
            delay: 0,
            distance: 18,
            scale: 0.992
        });
    });

    document.querySelectorAll('[data-reveal-group]').forEach((group) => {
        group.querySelectorAll(':scope > *').forEach((item, index) => {
            registerReveal(item, {
                delay: Math.min(index * 85, 400),
                distance: 14,
                scale: 0.99
            });
        });
    });

    document.querySelectorAll('main section:not(.hero) > .container').forEach((container) => {
        if (container.closest('.story-page')) {
            return;
        }

        registerReveal(container, {
            delay: 0,
            distance: 20,
            scale: 0.994
        });
    });

    const staggerSelectors = [
        '.service-cards > *',
        '.vehicle-cards > *',
        '.vehicle-gallery > *',
        '.video-gallery > *',
        '.location-grid > *',
        '.location-points li',
        '.about-features > *',
        '.contact-info > *',
        '.reasons > *',
        '.auth-points li'
    ];

    staggerSelectors.forEach((selector) => {
        document.querySelectorAll(selector).forEach((item, index) => {
            registerReveal(item, {
                delay: Math.min(index * 90, 360),
                distance: 15,
                scale: 0.988
            });
        });
    });

    document.querySelectorAll('.contact-form, .auth-panel, .auth-card, .cta .container, footer .container, .media-note').forEach((element) => {
        registerReveal(element, {
            delay: 60,
            distance: 12,
            scale: 0.995
        });
    });
}

function initializeDestinationSliders() {
    const sliders = document.querySelectorAll('[data-destination-slider]');
    if (!sliders.length) {
        return;
    }

    sliders.forEach((slider) => {
        const track = slider.querySelector('[data-slider-track]');
        const slides = track ? Array.from(track.querySelectorAll('.destination-slide')) : [];
        const prevButton = slider.querySelector('[data-slider-prev]');
        const nextButton = slider.querySelector('[data-slider-next]');
        const dotsContainer = slider.querySelector('[data-slider-dots]');

        if (!track || !slides.length) {
            return;
        }

        let currentIndex = 0;
        let autoTimer = null;
        let touchStartX = 0;
        let touchEndX = 0;

        const setActive = (nextIndex) => {
            currentIndex = (nextIndex + slides.length) % slides.length;
            track.style.transform = `translate3d(-${currentIndex * 100}%, 0, 0)`;

            slides.forEach((slide, index) => {
                slide.classList.toggle('is-active', index === currentIndex);
            });

            if (dotsContainer) {
                dotsContainer.querySelectorAll('button').forEach((dot, index) => {
                    dot.classList.toggle('is-active', index === currentIndex);
                    dot.setAttribute('aria-current', index === currentIndex ? 'true' : 'false');
                });
            }
        };

        const stopAuto = () => {
            if (autoTimer) {
                window.clearInterval(autoTimer);
                autoTimer = null;
            }
        };

        const startAuto = () => {
            stopAuto();
            autoTimer = window.setInterval(() => {
                setActive(currentIndex + 1);
            }, 5000);
        };

        if (dotsContainer) {
            slides.forEach((_, index) => {
                const dot = document.createElement('button');
                dot.type = 'button';
                dot.className = 'destination-dot';
                dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
                dot.addEventListener('click', () => {
                    setActive(index);
                    startAuto();
                });
                dotsContainer.appendChild(dot);
            });
        }

        if (prevButton) {
            prevButton.addEventListener('click', () => {
                setActive(currentIndex - 1);
                startAuto();
            });
        }

        if (nextButton) {
            nextButton.addEventListener('click', () => {
                setActive(currentIndex + 1);
                startAuto();
            });
        }

        slider.addEventListener('mouseenter', stopAuto);
        slider.addEventListener('mouseleave', startAuto);
        slider.addEventListener('focusin', stopAuto);
        slider.addEventListener('focusout', (event) => {
            const nextFocused = event.relatedTarget;
            if (!nextFocused || !slider.contains(nextFocused)) {
                startAuto();
            }
        });

        slider.addEventListener('touchstart', (event) => {
            touchStartX = event.changedTouches[0].clientX;
        }, { passive: true });

        slider.addEventListener('touchend', (event) => {
            touchEndX = event.changedTouches[0].clientX;
            const distance = touchStartX - touchEndX;
            if (Math.abs(distance) < 45) {
                return;
            }

            if (distance > 0) {
                setActive(currentIndex + 1);
            } else {
                setActive(currentIndex - 1);
            }
            startAuto();
        }, { passive: true });

        const destinationSelect = document.getElementById('destination-name');
        const destinationForm = document.getElementById('destination-enquiry-form');
        slider.querySelectorAll('[data-slide-book]').forEach((button) => {
            button.addEventListener('click', () => {
                const destinationValue = button.getAttribute('data-slide-book');
                if (!destinationValue || !destinationSelect) {
                    return;
                }

                destinationSelect.value = destinationValue;
                destinationSelect.dispatchEvent(new Event('change', { bubbles: true }));
                if (destinationForm) {
                    destinationForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        });

        setActive(0);
        startAuto();
    });
}

window.handleGoogleCredentialResponse = handleGoogleCredentialResponse;

