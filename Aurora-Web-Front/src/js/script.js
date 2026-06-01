// ========================================================
// CONFIGURACAO DOS SLIDES - TROQUE AS IMAGENS AQUI
// ========================================================
// Coloque as imagens em /images/ com os nomes sugeridos.
// Formatos aceitos: .webp (preferido), .jpg, .png ou .mp4.
// Dimensao recomendada: 2560x1440px (16:9), max 500KB cada.
// Enquanto a midia nao existir, o site mostra placeholders com gradiente.
// ========================================================

const SLIDES = [
    {
        id: 1,
        src: "images/base.png",
        alt: "Base lunar iluminada com paineis solares e modulo habitacional",
        type: "image", // "image" ou "video"
    },
    {
        id: 2,
        src: "images/base_lunar.png",
        alt: "Base lunar vista de longe na superficie da Lua",
        type: "image",
    },
    {
        id: 3,
        src: "images/sistemas_na_base.png",
        alt: "Sistemas energeticos monitorando a operacao da base lunar",
        type: "image",
    },
];

const SLIDE_DURATION = 7000;
const ALERT_SLIDE_DURATION = 4000;
const PLACEHOLDER_SLIDE_DURATION = 20000;
const PLACEHOLDERS = [
    "linear-gradient(135deg, #061021 0%, #0D1B2A 48%, #FF6B1A 140%)",
    "linear-gradient(135deg, #0A1428 0%, #123455 52%, #FF6B1A 118%)",
    "linear-gradient(135deg, #040814 0%, #152742 45%, #7A2F18 100%)",
];
const KEN_BURNS_MOVES = [
    { x: "-2%", y: "1%" },
    { x: "2%", y: "-1%" },
    { x: "-1.5%", y: "-2%" },
];

document.addEventListener("DOMContentLoaded", function () {
    iniciarTemas();
    iniciarSlideshow();
    iniciarFormulario();
});

function iniciarTemas() {
    const pagina = document.querySelector(".page-wrapper");
    const botoesTema = document.querySelectorAll('input[name="tema"]');

    if (!pagina || !botoesTema.length) return;

    function trocarTema(idTema) {
        pagina.dataset.theme = idTema.replace("tema-", "");
        document.dispatchEvent(
            new CustomEvent("aurora:tema", {
                detail: { idTema: idTema },
            })
        );
    }

    botoesTema.forEach(function (botao) {
        if (botao.checked) {
            trocarTema(botao.id);
        }

        botao.addEventListener("change", function () {
            if (botao.checked) {
                trocarTema(botao.id);
            }
        });
    });
}

function iniciarSlideshow() {
    const root = document.querySelector("[data-hero-slideshow]");
    const slidesContainer = document.querySelector("[data-hero-slides]");
    const dotsContainer = document.querySelector("[data-hero-dots]");
    const progressBar = document.querySelector("[data-hero-progress]");
    const prevButton = document.querySelector("[data-hero-prev]");
    const nextButton = document.querySelector("[data-hero-next]");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const hoverPause = window.matchMedia("(hover: hover) and (pointer: fine)");

    if (!root || !slidesContainer || !dotsContainer || !progressBar) return;

    let slideAtual = 0;
    let rafId = null;
    let iniciouEm = 0;
    let tempoPausado = 0;
    let pausadoPorHover = false;
    let pausadoPorAba = false;
    let touchStartX = 0;
    let touchStartY = 0;
    const midiasCarregadas = SLIDES.map(function () {
        return false;
    });
    const midiasComErro = SLIDES.map(function () {
        return false;
    });

    const slideElements = SLIDES.map(function (slide, index) {
        return criarSlide(slide, index);
    });

    const dotElements = SLIDES.map(function (slide, index) {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "hero__dot";
        dot.setAttribute("aria-label", "Ir para o slide " + slide.id);
        dot.addEventListener("click", function () {
            irParaSlide(index);
        });
        dotsContainer.appendChild(dot);
        return dot;
    });

    slideElements.forEach(function (slideElement) {
        slidesContainer.appendChild(slideElement);
    });

    if (prevButton) {
        prevButton.addEventListener("click", function () {
            irParaSlide(slideAtual - 1);
        });
    }

    if (nextButton) {
        nextButton.addEventListener("click", function () {
            irParaSlide(slideAtual + 1);
        });
    }

    root.addEventListener("mouseenter", function () {
        if (!hoverPause.matches) return;
        pausadoPorHover = true;
        pausarProgresso();
    });

    root.addEventListener("mouseleave", function () {
        if (!hoverPause.matches) return;
        pausadoPorHover = false;
        retomarProgresso();
    });

    root.addEventListener(
        "touchstart",
        function (event) {
            const toque = event.changedTouches[0];
            touchStartX = toque.clientX;
            touchStartY = toque.clientY;
        },
        { passive: true }
    );

    root.addEventListener(
        "touchend",
        function (event) {
            const toque = event.changedTouches[0];
            const deltaX = toque.clientX - touchStartX;
            const deltaY = toque.clientY - touchStartY;

            if (Math.abs(deltaX) > 48 && Math.abs(deltaX) > Math.abs(deltaY)) {
                irParaSlide(deltaX < 0 ? slideAtual + 1 : slideAtual - 1);
            }
        },
        { passive: true }
    );

    document.addEventListener("keydown", function (event) {
        const tag = event.target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

        if (event.key === "ArrowLeft") {
            irParaSlide(slideAtual - 1);
        }

        if (event.key === "ArrowRight") {
            irParaSlide(slideAtual + 1);
        }
    });

    document.addEventListener("visibilitychange", function () {
        pausadoPorAba = document.visibilityState !== "visible";

        if (pausadoPorAba) {
            pausarProgresso();
        } else {
            retomarProgresso();
        }
    });

    document.addEventListener("aurora:tema", function () {
        if (!reducedMotion.matches) {
            iniciarProgresso(false);
        }
    });

    reducedMotion.addEventListener("change", function () {
        if (reducedMotion.matches) {
            cancelarProgresso();
            progressBar.style.width = "0";
        } else {
            iniciarProgresso(true);
        }
    });

    ativarSlide(0);
    preloadProximoSlide();

    if (!reducedMotion.matches) {
        iniciarProgresso(true);
    }

    function criarSlide(slide, index) {
        const slideElement = document.createElement("article");
        slideElement.className = "hero__slide";
        slideElement.setAttribute("aria-label", "Slide " + slide.id);
        slideElement.style.setProperty("--kb-x", KEN_BURNS_MOVES[index].x);
        slideElement.style.setProperty("--kb-y", KEN_BURNS_MOVES[index].y);
        slideElement.style.setProperty("--placeholder-bg", PLACEHOLDERS[index]);

        const placeholder = document.createElement("div");
        placeholder.className = "hero__media hero__placeholder";
        placeholder.textContent = "SLIDE " + slide.id;
        slideElement.appendChild(placeholder);

        if (slide.type === "video") {
            const video = document.createElement("video");
            video.className = "hero__media";
            video.muted = true;
            video.loop = true;
            video.playsInline = true;
            video.preload = index === 0 ? "auto" : "metadata";
            video.setAttribute("aria-label", slide.alt);
            video.addEventListener("loadeddata", function () {
                midiasCarregadas[index] = true;
                midiasComErro[index] = false;
                video.hidden = false;
                iniciarProgresso(false);
            });
            video.addEventListener("error", function () {
                midiasComErro[index] = true;
                video.hidden = true;
                iniciarProgresso(false);
            });
            video.src = slide.src;
            slideElement.appendChild(video);
            return slideElement;
        }

        const imagem = document.createElement("img");
        imagem.className = "hero__media";
        imagem.alt = slide.alt;
        imagem.decoding = "async";
        imagem.loading = index === 0 ? "eager" : "lazy";

        if (index === 0) {
            imagem.fetchPriority = "high";
        }

        imagem.addEventListener("error", function () {
            midiasComErro[index] = true;
            imagem.hidden = true;
            iniciarProgresso(false);
        });

        imagem.addEventListener("load", function () {
            midiasCarregadas[index] = true;
            midiasComErro[index] = false;
            imagem.hidden = false;
            iniciarProgresso(false);
        });

        imagem.src = slide.src;
        slideElement.appendChild(imagem);
        return slideElement;
    }

    function irParaSlide(index) {
        ativarSlide(index);
        iniciarProgresso(true);
    }

    function ativarSlide(index) {
        slideAtual = (index + SLIDES.length) % SLIDES.length;

        slideElements.forEach(function (slideElement, itemIndex) {
            const ativo = itemIndex === slideAtual;
            slideElement.classList.toggle("is-active", ativo);
            slideElement.setAttribute("aria-hidden", String(!ativo));

            const video = slideElement.querySelector("video");
            if (!video) return;

            if (ativo && !reducedMotion.matches) {
                video.play().catch(function () {});
            } else {
                video.pause();
            }
        });

        dotElements.forEach(function (dot, itemIndex) {
            const ativo = itemIndex === slideAtual;
            dot.classList.toggle("is-active", ativo);
            dot.setAttribute("aria-current", ativo ? "true" : "false");
        });

        preloadProximoSlide();
    }

    function avancarSlide() {
        ativarSlide(slideAtual + 1);
        iniciarProgresso(true);
    }

    function obterDuracaoAtual() {
        const alertaAtivo = document.getElementById("tema-alerta");
        if (alertaAtivo && alertaAtivo.checked) {
            return ALERT_SLIDE_DURATION;
        }

        if (slideUsaPlaceholder(slideAtual)) {
            return PLACEHOLDER_SLIDE_DURATION;
        }

        return SLIDE_DURATION;
    }

    function slideUsaPlaceholder(index) {
        return midiasComErro[index] || !midiasCarregadas[index];
    }

    function iniciarProgresso(reiniciar) {
        if (reducedMotion.matches) return;

        cancelarProgresso();

        if (reiniciar) {
            tempoPausado = 0;
            progressBar.style.width = "0";
        } else {
            const duracao = obterDuracaoAtual();
            const larguraAtual = parseFloat(progressBar.style.width) || 0;
            tempoPausado = Math.min(duracao, (larguraAtual / 100) * duracao);
        }

        if (pausadoPorHover || pausadoPorAba) return;

        iniciouEm = performance.now();
        rafId = requestAnimationFrame(animarProgresso);
    }

    function animarProgresso(agora) {
        const duracao = obterDuracaoAtual();
        const decorrido = tempoPausado + agora - iniciouEm;
        const progresso = Math.min(decorrido / duracao, 1);

        progressBar.style.width = progresso * 100 + "%";

        if (progresso >= 1) {
            avancarSlide();
            return;
        }

        rafId = requestAnimationFrame(animarProgresso);
    }

    function pausarProgresso() {
        if (reducedMotion.matches || rafId === null) return;

        tempoPausado += performance.now() - iniciouEm;
        cancelarProgresso();
    }

    function retomarProgresso() {
        if (reducedMotion.matches || pausadoPorHover || pausadoPorAba) return;

        iniciouEm = performance.now();
        rafId = requestAnimationFrame(animarProgresso);
    }

    function cancelarProgresso() {
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    }

    function preloadProximoSlide() {
        const proximo = SLIDES[(slideAtual + 1) % SLIDES.length];

        if (proximo.type === "video") {
            const video = document.createElement("video");
            video.preload = "metadata";
            video.src = proximo.src;
            return;
        }

        const imagem = new Image();
        imagem.src = proximo.src;
    }
}

function iniciarFormulario() {
    const formulario = document.getElementById("form-missao");
    const feedback = document.getElementById("form-feedback");

    if (!formulario) return;

    formulario.addEventListener("submit", function (event) {
        event.preventDefault();

        if (!formulario.checkValidity()) {
            formulario.classList.add("tentou-enviar");
            if (feedback) {
                feedback.textContent = "Preencha todos os campos corretamente.";
            }
            return;
        }

        formulario.classList.remove("tentou-enviar");
        formulario.reset();

        if (feedback) {
            feedback.textContent = "Mensagem realizada com sucesso. Agradecemos seu contato!";
        }
    });
}
