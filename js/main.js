(() => {
    'use strict';

    window.WHATSAPP_PHONE = window.WHATSAPP_PHONE || '917073145232';
    window.GCS_API_KEY = window.GCS_API_KEY || '';
    window.GCS_CX = window.GCS_CX || '';

    function generateWhatsAppURL(message) {
        const WHATSAPP_NUMBER = "917073145232";
        return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    }

    // Cache to hold custom search engine image results
    const imageSearchCache = {};

    let currentUser = null;

    const defaultTagsByCategory = {
        sedan: ['Premium Interiors', 'Silent Cabin', 'Smooth Comfort'],
        mpv: ['Spacious Cabin', 'Air Conditioning', 'Luggage Bay'],
        traveller: ['All-Terrain Ready', 'Plush Seats', 'Long Route Comfort']
    };

    const detailState = {
        car: null,
        images: [],
        index: 0
    };

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
        initializeAuthUI();
        setupBookingModalControls();
        setupVehicleModalControls();
        initializeDetailBookingForm();
        initializeCarServices();
        initializeHomeMap();
        initializeScrollReveal();
        initializeDestinationSliders();
        initializeDestinationsForm();
        initializeContactForm();
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
        alert('Welcome, ' + name + '! Your account has been authenticated successfully.');
        window.location.href = './index.html';
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
                    setFormStatus(form, error.message || 'Could not connect to our booking desk. Please try again or call us directly.', 'error');
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

    async function fetchCurrentUser() {
        try {
            const response = await fetch('/api/auth/me', {
                credentials: 'include'
            });
            if (!response.ok) {
                currentUser = null;
                return null;
            }
            const data = await response.json();
            currentUser = data.user;
            return currentUser;
        } catch (_error) {
            currentUser = null;
            return null;
        }
    }

    function updateNavAuthState() {
        const navLinks = document.querySelector('.nav-links');
        if (!navLinks) {
            return;
        }

        const signIn = navLinks.querySelector('a[href="signin.html"]');
        const signUp = navLinks.querySelector('a[href="signup.html"]');
        const existingLogout = navLinks.querySelector('[data-logout]');

        if (currentUser) {
            if (signIn) {
                signIn.parentElement.style.display = 'none';
            }
            if (signUp) {
                signUp.parentElement.style.display = 'none';
            }
            if (!existingLogout) {
                const li = document.createElement('li');
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'nav-cta';
                btn.textContent = 'Logout';
                btn.setAttribute('data-logout', 'true');
                btn.addEventListener('click', async () => {
                    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
                    currentUser = null;
                    updateNavAuthState();
                    window.location.href = '/';
                });
                li.appendChild(btn);
                navLinks.appendChild(li);
            }
        } else {
            if (signIn) {
                signIn.parentElement.style.display = '';
            }
            if (signUp) {
                signUp.parentElement.style.display = '';
            }
            if (existingLogout) {
                existingLogout.parentElement.remove();
            }
        }
    }

    async function initializeAuthUI() {
        await fetchCurrentUser();
        updateNavAuthState();
    }

    function createCarCard(car) {
        const card = document.createElement('article');
        card.className = 'car-card vehicle-card';
        card.setAttribute('data-category', car.category);

        const whatsappNumber = (car.whatsappNumber || window.WHATSAPP_PHONE || '').replace(/[^0-9]/g, '');
        const waLink = whatsappNumber
            ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hi, I want to book the ${car.name} (${car.category}) on Travel Baadsha.`)}`
            : null;

        // Visual layout rebalanced elegantly: pricing label completely omitted, header h3 spans full width.
        card.innerHTML = `
            <div class="card-media">
                <span class="badge badge-category">${formatCategoryName(car.category)}</span>
                <img src="${car.image || './media/images/vehicle-01.jpg'}" alt="${car.name}" loading="lazy"
                    onerror="this.onerror=null;this.src='./media/images/vehicle-01.jpg';">
            </div>
            <div class="card-body">
                <div class="card-top">
                    <h3>${car.name}</h3>
                </div>
                <p class="vehicle-desc">${car.description || ''}</p>
                <div class="car-meta">
                    <span>${car.seats || 4} seats</span>
                    <span>${car.fuelType || ''}</span>
                    <span>${car.transmission || ''}</span>
                </div>
                <div class="car-actions">
                    <button class="btn-secondary btn-details" type="button" data-car-id="${car.id}">View Details</button>
                    <button class="btn-primary btn-book" type="button" data-car-id="${car.id}">Book Now</button>
                    ${waLink ? `<a class="btn-whatsapp-icon" href="${waLink}" target="_blank" rel="noreferrer noopener" aria-label="WhatsApp ${car.name} booking">WA</a>` : ''}
                </div>
            </div>
        `;
        return card;
    }

    function showBookingModal(car) {
        const modal = document.getElementById('booking-modal');
        if (!modal) return;
        modal.hidden = false;
        modal.classList.add('is-open');
        document.body.style.overflow = 'hidden';

        document.getElementById('booking-name').textContent = car.name;
        document.getElementById('booking-category').textContent = formatCategoryName(car.category);
        document.getElementById('booking-car-id').value = car.id;

        const bookingForm = document.getElementById('booking-form');
        if (bookingForm) {
            bookingForm.dataset.pricePerDay = car.pricePerDay || '';
            bookingForm.dataset.vehicleName = car.name || '';
        }

        const status = modal.querySelector('.form-status');
        if (status) {
            status.textContent = '';
            status.classList.remove('is-error', 'is-success');
        }
    }

    function hideBookingModal() {
        const modal = document.getElementById('booking-modal');
        if (!modal) return;
        modal.classList.remove('is-open');
        modal.hidden = true;
        document.body.style.overflow = '';
    }

    const manualGalleryOverrides = window.VEHICLE_GALLERIES || {};

    function formatCategoryName(category) {
        const labels = {
            sedan: 'Sedan',
            mpv: 'MPV',
            traveller: 'Bus/Traveller'
        };
        return labels[category] || (category || '').replace('-', ' ');
    }

    function formatRupees(value) {
        return `₹${Number(value || 0).toLocaleString('en-IN')}`;
    }

    function getFeatureTags(car) {
        if (car.tags && Array.isArray(car.tags)) {
            return car.tags;
        }
        return defaultTagsByCategory[car.category] || [];
    }

    async function fetchRelatedImages(query, limit = 4) {
        if (!window.GCS_API_KEY || !window.GCS_CX) {
            return [];
        }

        const cacheKey = `${query}_${limit}`;
        if (imageSearchCache[cacheKey]) {
            return imageSearchCache[cacheKey];
        }

        const searchUrl = new URL('https://www.googleapis.com/customsearch/v1');
        searchUrl.searchParams.set('searchType', 'image');
        searchUrl.searchParams.set('num', String(limit));
        searchUrl.searchParams.set('q', query);
        searchUrl.searchParams.set('key', window.GCS_API_KEY);
        searchUrl.searchParams.set('cx', window.GCS_CX);

        try {
            const res = await fetch(searchUrl.toString());
            if (!res.ok) {
                throw new Error('Image search failed');
            }
            const data = await res.json();
            const items = data.items || [];
            const links = items.map((item) => item.link).filter(Boolean);
            imageSearchCache[cacheKey] = links;
            return links;
        } catch (_error) {
            return [];
        }
    }

    async function buildGalleryImages(car) {
        const manual = manualGalleryOverrides[car.id] || [];
        const base = car.image ? [car.image] : [];
        const provided = Array.isArray(car.gallery) ? car.gallery : [];
        const fetched = await fetchRelatedImages(`${car.name} ${car.category}`, 4);
        const unique = [];
        const seen = new Set();

        [...manual, ...provided, ...base, ...fetched].forEach((src) => {
            if (src && !seen.has(src)) {
                seen.add(src);
                unique.push(src);
            }
        });

        if (!unique.length) {
            unique.push('./media/images/vehicle-01.jpg');
        }

        return unique.slice(0, 6);
    }

    function renderVehicleGallery(images) {
        const mainImage = document.getElementById('vehicle-main-image');
        const thumbs = document.getElementById('vehicle-thumbs');
        if (!mainImage || !thumbs) {
            return;
        }

        thumbs.innerHTML = '';
        detailState.images = images;
        detailState.index = 0;
        mainImage.src = images[0];

        images.forEach((src, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'thumb';
            button.setAttribute('aria-label', `Show image ${index + 1}`);
            button.innerHTML = `<img src="${src}" alt="Vehicle image ${index + 1}" loading="lazy">`;
            if (index === 0) {
                button.classList.add('is-active');
            }
            button.addEventListener('click', () => setActiveGalleryIndex(index));
            thumbs.appendChild(button);
        });
    }

    function setActiveGalleryIndex(nextIndex) {
        const mainImage = document.getElementById('vehicle-main-image');
        const thumbs = document.querySelectorAll('#vehicle-thumbs .thumb');
        if (!mainImage || !thumbs.length) {
            return;
        }
        detailState.index = (nextIndex + detailState.images.length) % detailState.images.length;
        mainImage.classList.add('is-fading');
        mainImage.onload = () => mainImage.classList.remove('is-fading');
        mainImage.src = detailState.images[detailState.index];

        thumbs.forEach((thumb, idx) => {
            thumb.classList.toggle('is-active', idx === detailState.index);
        });
    }

    function closeVehicleModal() {
        const modal = document.getElementById('vehicle-modal');
        if (!modal) return;
        modal.classList.remove('is-open');
        modal.hidden = true;
        document.body.style.overflow = '';
    }

    // Controls setup: escapes, keyboard mapping, gallery arrows. Defensive selectors prevent null pointer exceptions.
    function setupVehicleModalControls() {
        const modal = document.getElementById('vehicle-modal');
        if (!modal) return;

        const closeBtn = modal.querySelector('.close-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeVehicleModal);
        }
        modal.addEventListener('click', (event) => {
            if (event.target === modal || event.target.closest('.close-modal')) {
                closeVehicleModal();
            }
        });
        modal.querySelector('[data-gallery-prev]')?.addEventListener('click', () => {
            setActiveGalleryIndex(detailState.index - 1);
        });
        modal.querySelector('[data-gallery-next]')?.addEventListener('click', () => {
            setActiveGalleryIndex(detailState.index + 1);
        });

        window.addEventListener('keydown', (event) => {
            if (modal.hidden) {
                return;
            }
            if (event.key === 'Escape') {
                closeVehicleModal();
            }
            if (event.key === 'ArrowLeft') {
                setActiveGalleryIndex(detailState.index - 1);
            }
            if (event.key === 'ArrowRight') {
                setActiveGalleryIndex(detailState.index + 1);
            }
        });
    }

    async function openVehicleDetails(car) {
        const modal = document.getElementById('vehicle-modal');
        if (!modal) return;

        detailState.car = car;
        const images = await buildGalleryImages(car);
        renderVehicleGallery(images);

        modal.querySelector('#vehicle-category').textContent = formatCategoryName(car.category);
        modal.querySelector('#vehicle-title').textContent = car.name;
        modal.querySelector('#vehicle-description').textContent = car.description || '';
        modal.querySelector('#vehicle-seats').textContent = `${car.seats || '?'} Seats`;
        modal.querySelector('#vehicle-fuel').textContent = car.fuelType || '—';
        modal.querySelector('#vehicle-transmission').textContent = car.transmission || '—';
        modal.querySelector('#vehicle-color').textContent = car.color || '—';

        // Set the three dynamic new specs required by the prompt
        if (modal.querySelector('#vehicle-usage')) {
            modal.querySelector('#vehicle-usage').textContent = car.travelUsage || 'Premium chauffeur services, outstation trips, and airport transfers.';
        }
        if (modal.querySelector('#vehicle-comfort')) {
            modal.querySelector('#vehicle-comfort').textContent = car.comfortFeatures || 'Premium climate control, plush ergonomic seating, dynamic ambient lighting.';
        }
        if (modal.querySelector('#vehicle-travel-type')) {
            modal.querySelector('#vehicle-travel-type').textContent = car.suitableTravelType || 'VIP Executive, Small Families, and Corporate Travel.';
        }

        const tagWrap = modal.querySelector('#vehicle-tags');
        if (tagWrap) {
            tagWrap.innerHTML = '';
            getFeatureTags(car).forEach((tag) => {
                const span = document.createElement('span');
                span.className = 'chip';
                span.textContent = tag;
                tagWrap.appendChild(span);
            });
        }

        // Setup the new unified booking flow buttons inside the details modal
        const bookNowBtn = modal.querySelector('#detail-book-now');
        if (bookNowBtn) {
            const newBookNowBtn = bookNowBtn.cloneNode(true);
            bookNowBtn.parentNode.replaceChild(newBookNowBtn, bookNowBtn);
            newBookNowBtn.addEventListener('click', () => {
                closeVehicleModal();
                showBookingModal(car);
            });
        }

        const whatsappBtn = modal.querySelector('#detail-whatsapp-btn');
        if (whatsappBtn) {
            const waLink = generateWhatsAppURL(`Hi, I want to book the ${car.name} (${formatCategoryName(car.category)}) on Travel Baadsha.`);
            whatsappBtn.href = waLink;
        }

        modal.hidden = false;
        modal.classList.add('is-open');
        document.body.style.overflow = 'hidden';
    }

    function validateDetailDates(form) {
        const startDate = form.startDate.value;
        const endDate = form.endDate.value;
        if (!startDate || !endDate) {
            return { valid: false, message: 'Select both start and end dates.' };
        }
        if (new Date(endDate) < new Date(startDate)) {
            return { valid: false, message: 'End date cannot be before start date.' };
        }
        return { valid: true, startDate, endDate };
    }

    function buildWhatsAppUrl(car, form) {
        const name = form.customerName.value.trim();
        const email = form.customerEmail.value.trim();
        const phone = form.customerPhone.value.trim();
        const startDate = form.startDate.value;
        const endDate = form.endDate.value;
        const notes = form.notes.value.trim();

        const message = [
            `Vehicle: ${car.name}`,
            `Category: ${formatCategoryName(car.category)}`,
            startDate && endDate ? `Dates: ${startDate} to ${endDate}` : 'Dates: (not selected)',
            name ? `Name: ${name}` : '',
            email ? `Email: ${email}` : '',
            phone ? `Phone: ${phone}` : '',
            notes ? `Notes: ${notes}` : ''
        ]
            .filter(Boolean)
            .join('\n');

        return generateWhatsAppURL(message);
    }

    function handleWhatsAppBooking(event) {
        event.preventDefault();
        if (!detailState.car) return;
        const form = document.getElementById('detail-booking-form');
        const status = form?.querySelector('.form-status');
        const dateCheck = validateDetailDates(form);
        if (!dateCheck.valid) {
            if (status) {
                status.textContent = dateCheck.message;
                status.classList.add('is-error');
            }
            return;
        }
        if (status) {
            status.textContent = 'Opening WhatsApp...';
            status.classList.remove('is-error');
        }
        window.open(buildWhatsAppUrl(detailState.car, form), '_blank');
    }

    async function submitDetailBooking(event) {
        event.preventDefault();
        if (!detailState.car) return;
        const form = event.currentTarget;
        const status = form.querySelector('.form-status');
        const submitBtn = form.querySelector('button[type="submit"]');
        const spinner = form.querySelector('.btn-spinner');
        const dateCheck = validateDetailDates(form);

        if (!dateCheck.valid) {
            if (status) {
                status.textContent = dateCheck.message;
                status.classList.add('is-error');
            }
            return;
        }

        const payload = {
            vehicleId: detailState.car.id,
            vehicleName: detailState.car.name,
            pricePerDay: detailState.car.pricePerDay,
            userName: form.customerName.value.trim(),
            email: form.customerEmail.value.trim(),
            phone: form.customerPhone.value.trim(),
            startDate: form.startDate.value,
            endDate: form.endDate.value,
            notes: form.notes.value.trim(),
            bookingSource: 'form'
        };

        if (!payload.userName || !payload.email || !payload.phone) {
            if (status) {
                status.textContent = 'Name, email, and phone are required.';
                status.classList.add('is-error');
            }
            return;
        }

        if (submitBtn) submitBtn.disabled = true;
        if (spinner) spinner.classList.remove('is-hidden');
        if (status) {
            status.textContent = 'Submitting...';
            status.classList.remove('is-error', 'is-success');
        }

        try {
            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                const message = data && data.message ? data.message : 'Booking failed. Please try again.';
                throw new Error(message);
            }
            if (status) {
                status.textContent = data.message || 'Booking received. We will confirm shortly.';
                status.classList.add('is-success');
            }
            form.reset();
        } catch (error) {
            if (status) {
                status.textContent = error.message || 'Booking failed.';
                status.classList.add('is-error');
            }
        } finally {
            if (submitBtn) submitBtn.disabled = false;
            if (spinner) spinner.classList.add('is-hidden');
        }
    }

    function initializeDetailBookingForm() {
        const form = document.getElementById('detail-booking-form');
        const whatsappBtn = document.getElementById('whatsapp-book-btn');
        if (whatsappBtn) {
            whatsappBtn.addEventListener('click', handleWhatsAppBooking);
        }
        if (form) {
            form.addEventListener('submit', submitDetailBooking);
        }
    }

    // Modal dialogue handlers
    function setupBookingModalControls() {
        const modal = document.getElementById('booking-modal');
        if (!modal) {
            return;
        }

        const closeBtn = modal.querySelector('.close-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', hideBookingModal);
        }

        modal.addEventListener('click', (event) => {
            if (event.target === modal || event.target.closest('.close-modal')) {
                hideBookingModal();
            }
        });

        window.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && !modal.hidden) {
                hideBookingModal();
            }
        });
    }

    async function initializeCarServices() {
        const grid = document.querySelector('[data-car-grid]');
        if (!grid) return;

        const filters = document.querySelectorAll('.filter-btn');
        const form = document.getElementById('booking-form');
        let cars = Array.isArray(window.VEHICLES) ? window.VEHICLES : [];

        // Category filters updated to only display the requested: Sedan, MPV, and Bus/Traveller.
        const categoryLabels = {
            sedan: 'Sedan',
            mpv: 'MPV',
            traveller: 'Bus/Traveller'
        };
        const categoryOrder = ['sedan', 'mpv', 'traveller'];

        const renderCars = (category) => {
            grid.innerHTML = '';
            const activeCats = category === 'all' ? categoryOrder : [category];
            let rendered = 0;

            activeCats.forEach((cat) => {
                const catCars = cars.filter((c) => c.category === cat);
                if (!catCars.length) return;

                const section = document.createElement('div');
                section.className = 'category-block';
                section.dataset.category = cat;
                section.setAttribute('data-reveal', '');

                section.innerHTML = `
                    <div class="category-heading">
                        <h3>${categoryLabels[cat] || cat}</h3>
                        <p class="section-copy">Handpicked premium ${categoryLabels[cat] || cat} fleet with professional chauffeurs.</p>
                    </div>
                    <div class="modern-grid vehicle-grid"></div>
                `;

                const wrap = section.querySelector('.vehicle-grid');
                catCars.forEach((car) => {
                    const card = createCarCard(car);
                    wrap.appendChild(card);
                    const bookBtn = card.querySelector('.btn-book');
                    const detailBtn = card.querySelector('.btn-details');
                    if (bookBtn) bookBtn.addEventListener('click', () => showBookingModal(car));
                    if (detailBtn) detailBtn.addEventListener('click', () => openVehicleDetails(car));
                });

                grid.appendChild(section);
                rendered += catCars.length;
            });

            if (!rendered) {
                grid.innerHTML = '<p class="form-status is-error">No vehicles in this category.</p>';
            }
        };

        filters.forEach((btn) => {
            btn.addEventListener('click', () => {
                filters.forEach((b) => b.classList.remove('is-active'));
                btn.classList.add('is-active');
                filters.forEach((b) => b.setAttribute('aria-selected', 'false'));
                btn.setAttribute('aria-selected', 'true');
                renderCars(btn.getAttribute('data-filter'));
            });
        });

        if (form) {
            form.addEventListener('submit', (event) => {
                event.preventDefault();
                const status = form.querySelector('.form-status');
                const submitBtn = form.querySelector('button[type="submit"]');
                const startDate = form.startDate.value;
                const endDate = form.endDate.value;

                if (!startDate || !endDate) {
                    if (status) {
                        status.textContent = 'Select start and end dates.';
                        status.classList.add('is-error');
                        status.classList.remove('is-success');
                    }
                    return;
                }
                if (new Date(endDate) < new Date(startDate)) {
                    if (status) {
                        status.textContent = 'End date cannot be before start date.';
                        status.classList.add('is-error');
                        status.classList.remove('is-success');
                    }
                    return;
                }

                const vehicleName = form.dataset.vehicleName || 'a vehicle';
                const vehicleCategory = form.dataset.vehicleCategory || (document.getElementById('booking-category') ? document.getElementById('booking-category').textContent.trim() : '');
                const userName = form.customerName ? form.customerName.value.trim() : '';
                const phone = form.customerPhone ? form.customerPhone.value.trim() : '';
                const email = form.customerEmail ? form.customerEmail.value.trim() : '';
                const notes = form.notes ? form.notes.value.trim() : '';

                if (!userName || !email || !phone) {
                    if (status) {
                        status.textContent = 'Name, email, and phone are required.';
                        status.classList.add('is-error');
                        status.classList.remove('is-success');
                    }
                    return;
                }

                const message = [
                    '====================================',
                    'TRAVEL BAADSHA',
                    'VEHICLE RESERVATION REQUEST',
                    '====================================',
                    '',
                    'Vehicle:',
                    vehicleName,
                    '',
                    'Category:',
                    vehicleCategory,
                    '',
                    'Full Name:',
                    userName,
                    '',
                    'Email:',
                    email,
                    '',
                    'Phone:',
                    phone,
                    '',
                    'Journey Start:',
                    startDate,
                    '',
                    'Journey Return:',
                    endDate,
                    '',
                    'Special Requirements:',
                    notes || '(none)',
                    '',
                    'Submitted Via:',
                    'Travel Baadsha Website',
                    '',
                    '===================================='
                ].join('\n');

                if (status) {
                    status.textContent = 'Redirecting to WhatsApp to complete your booking...';
                    status.classList.remove('is-error');
                    status.classList.add('is-success');
                }
                if (submitBtn) submitBtn.disabled = true;

                window.setTimeout(() => {
                    const url = generateWhatsAppURL(message);
                    window.open(url, '_blank');
                    hideBookingModal();
                    form.reset();
                    if (submitBtn) submitBtn.disabled = false;
                }, 800);
            });
        }

        function initializeDestinationsForm() {
            const destForm = document.getElementById('destination-enquiry-form');
            if (!destForm) return;

            destForm.addEventListener('submit', (event) => {
                event.preventDefault();
                const status = destForm.querySelector('.form-status');

                const destSelect = destForm.querySelector('#destination-name');
                const travelDateInput = destForm.querySelector('#travel-date');
                const groupSizeInput = destForm.querySelector('#group-size');
                const pickupCityInput = destForm.querySelector('#pickup-city');

                if (!destSelect || !travelDateInput || !groupSizeInput || !pickupCityInput) return;

                const destination = destSelect.options[destSelect.selectedIndex] ? destSelect.options[destSelect.selectedIndex].text : destSelect.value;
                const journeyDate = travelDateInput.value;
                const totalTravelers = groupSizeInput.value;
                const pickupCity = pickupCityInput.value.trim();

                if (!destSelect.value || !journeyDate || !totalTravelers || !pickupCity) {
                    if (status) {
                        status.textContent = 'All fields are required.';
                        status.classList.add('is-error');
                        status.classList.remove('is-success');
                    }
                    return;
                }

                if (Number(totalTravelers) < 1) {
                    if (status) {
                        status.textContent = 'Total travelers must be at least 1.';
                        status.classList.add('is-error');
                        status.classList.remove('is-success');
                    }
                    return;
                }

                const message = [
                    '====================================',
                    'TRAVEL BAADSHA',
                    'CUSTOM ITINERARY REQUEST',
                    '====================================',
                    '',
                    'Destination:',
                    destination,
                    '',
                    'Journey Date:',
                    journeyDate,
                    '',
                    'Total Travelers:',
                    totalTravelers,
                    '',
                    'Pickup City:',
                    pickupCity,
                    '',
                    'Submitted Via:',
                    'Travel Baadsha Website',
                    '',
                    '===================================='
                ].join('\n');

                if (status) {
                    status.textContent = 'Redirecting to WhatsApp...';
                    status.classList.remove('is-error');
                    status.classList.add('is-success');
                }

                window.setTimeout(() => {
                    const url = generateWhatsAppURL(message);
                    window.open(url, '_blank');
                    destForm.reset();
                    if (status) {
                        status.textContent = '';
                        status.classList.remove('is-success');
                    }
                }, 800);
            });
        }

        function initializeContactForm() {
            const contactForm = document.querySelector('form.contact-form:not(#destination-enquiry-form):not([data-api-endpoint="/api/video-enquiry"])');
            if (!contactForm) return;

            contactForm.addEventListener('submit', (event) => {
                event.preventDefault();
                const status = contactForm.querySelector('.form-status');

                const nameInput = contactForm.querySelector('#name');
                const phoneInput = contactForm.querySelector('#phone');
                const reqInput = contactForm.querySelector('#requirement');

                if (!nameInput || !phoneInput || !reqInput) return;

                const name = nameInput.value.trim();
                const phone = phoneInput.value.trim();
                const requirements = reqInput.value.trim();

                if (!name || !phone || !requirements) {
                    if (status) {
                        status.textContent = 'All fields are required.';
                        status.classList.add('is-error');
                        status.classList.remove('is-success');
                    }
                    return;
                }

                const message = [
                    '====================================',
                    'TRAVEL BAADSHA',
                    'BOOKING INQUIRY',
                    '====================================',
                    '',
                    'Full Name:',
                    name,
                    '',
                    'Phone Number:',
                    phone,
                    '',
                    'Travel Requirements:',
                    requirements,
                    '',
                    'Submitted Via:',
                    'Travel Baadsha Website',
                    '',
                    '===================================='
                ].join('\n');

                if (status) {
                    status.textContent = 'Redirecting to WhatsApp...';
                    status.classList.remove('is-error');
                    status.classList.add('is-success');
                }

                window.setTimeout(() => {
                    const url = generateWhatsAppURL(message);
                    window.open(url, '_blank');
                    contactForm.reset();
                    if (status) {
                        status.textContent = '';
                        status.classList.remove('is-success');
                    }
                }, 800);
            });
        }

        // Vehicles always loaded from pre-populated static window.VEHICLES array
        if (!cars.length) {
            grid.innerHTML = '<p class="form-status is-error">No vehicles available at the moment. Please contact us directly.</p>';
            return;
        }

        renderCars('all');
    }

    // Export public hooks to window securely inside the closure
    window.handleGoogleCredentialResponse = handleGoogleCredentialResponse;
})();
