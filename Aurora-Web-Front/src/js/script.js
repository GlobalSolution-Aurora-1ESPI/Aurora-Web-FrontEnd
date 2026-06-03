// ============================================================
// script.js — JavaScript do projeto AURORA
// Aqui ficam o slideshow, os temas, o formulário e o quiz.
// ============================================================

// Lista de imagens do slideshow com caminho, texto alternativo e tipo
const SLIDES = [
    {
        id: 1,
        src: "img/base.png",
        alt: "Base lunar iluminada com paineis solares e modulo habitacional",
        type: "image", // tipo da mídia: "image" ou "video"
    },
    {
        id: 2,
        src: "img/base_lunar.png",
        alt: "Base lunar vista de longe na superficie da Lua",
        type: "image",
    },
    {
        id: 3,
        src: "img/sistemas_na_base.png",
        alt: "Sistemas energeticos monitorando a operacao da base lunar",
        type: "image",
    },
];

// Duração de cada slide em milissegundos (7s normal, 4s no tema alerta)
const SLIDE_DURATION = 7000;
const ALERT_SLIDE_DURATION = 4000;
const PLACEHOLDER_SLIDE_DURATION = 20000; // Mais tempo se a imagem não carregar
const PLACEHOLDERS = [
    "linear-gradient(135deg, #061021 0%, #0D1B2A 48%, #FF6B1A 140%)",
    "linear-gradient(135deg, #0A1428 0%, #123455 52%, #FF6B1A 118%)",
    "linear-gradient(135deg, #040814 0%, #152742 45%, #7A2F18 100%)",
];
// Direção do movimento do efeito Ken Burns para cada slide
const KEN_BURNS_MOVES = [
    { x: "-2%", y: "1%" },
    { x: "2%", y: "-1%" },
    { x: "-1.5%", y: "-2%" },
];

// Espera o HTML carregar completamente antes de rodar o JavaScript
document.addEventListener("DOMContentLoaded", function () {
    iniciarTemas();      // Configura a troca de temas
    iniciarSlideshow();  // Monta e anima o slideshow do hero
    iniciarFormulario(); // Configura a validação do formulário
    iniciarQuiz();       // Monta o quiz com as 10 perguntas
});

// Cores de cada tema — usadas pelo JS para alterar as variáveis CSS dinamicamente
const TEMAS = {
    "tema-dia": {
        "--bg": "#F4F1EA",
        "--navy": "#E6E0D4",
        "--amber": "#FF6B1A",
        "--text": "#162238",
        "--text-muted": "#4E5D73",
        "--border": "#CFC6B8",
    },
    "tema-noite": {
        "--bg": "#0A1428",
        "--navy": "#0D1B2A",
        "--amber": "#FF6B1A",
        "--text": "#E6EAF2",
        "--text-muted": "#8A9BB0",
        "--border": "#1E3A5F",
    },
    "tema-alerta": {
        "--bg": "#1A0000",
        "--navy": "#0D0000",
        "--amber": "#FF4444",
        "--text": "#FFF1F0",
        "--text-muted": "#FFBDB7",
        "--border": "#5E1717",
    },
};

// Função que detecta qual tema foi selecionado e aplica as cores via JavaScript
function iniciarTemas() {
    const pagina = document.querySelector(".page-wrapper");
    const botoesTema = document.querySelectorAll('input[name="tema"]');

    if (!pagina || !botoesTema.length) return;

    // Aplica o tema escolhido alterando as variáveis CSS no elemento raiz da página
    function trocarTema(idTema) {
        pagina.dataset.theme = idTema.replace("tema-", "");

        const vars = TEMAS[idTema];
        if (vars) {
            // Percorre cada variável CSS do tema e aplica no documento
            Object.keys(vars).forEach(function (prop) {
                document.documentElement.style.setProperty(prop, vars[prop]);
            });
        }

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

// Função principal do slideshow — cria os slides, dots e controla a navegação
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

    // Variáveis de controle do slideshow
    let slideAtual = 0;         // Índice do slide visível no momento
    let rafId = null;           // ID da animação em andamento
    let iniciouEm = 0;          // Momento em que o progresso começou
    let tempoPausado = 0;       // Quanto tempo ficou pausado
    let pausadoPorHover = false; // Pausa quando o mouse está em cima
    let pausadoPorAba = false;  // Pausa quando a aba não está visível
    let touchStartX = 0;        // Posição inicial do toque (swipe)
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

    // Cria o elemento HTML de cada slide e adiciona a imagem ou vídeo
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

    // Vai para o slide do índice informado e reinicia o progresso
    function irParaSlide(index) {
        ativarSlide(index);
        iniciarProgresso(true);
    }

    // Ativa o slide do índice calculado e atualiza os dots de navegação
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

    // Avança automaticamente para o próximo slide quando o tempo acaba
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

    // Atualiza a barra de progresso a cada frame e avança o slide quando chegar a 100%
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

    // Carrega a próxima imagem em segundo plano para evitar travamento na transição
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

// Função de validação do formulário — feita em JavaScript puro, sem usar o "required" do HTML
function iniciarFormulario() {
    const formulario = document.getElementById("form-missao");
    const feedback = document.getElementById("form-feedback");

    if (!formulario) return;

    // Mostra a mensagem de erro em vermelho no parágrafo de feedback
    function mostrarErro(mensagem) {
        if (feedback) {
            feedback.style.color = "#FF7A7A";
            feedback.textContent = mensagem;
        }
    }

    // Mostra a mensagem de sucesso em verde quando o envio é válido
    function mostrarSucesso(mensagem) {
        if (feedback) {
            feedback.style.color = "";
            feedback.textContent = mensagem;
        }
    }

    // Intercepta o envio do formulário e valida cada campo manualmente
    formulario.addEventListener("submit", function (event) {
        event.preventDefault(); // Impede a página de recarregar ao enviar

        // Pega o valor de cada campo e remove espaços extras nas bordas
        const nome = document.getElementById("nome").value.trim();
        const email = document.getElementById("email").value.trim();
        const mensagem = document.getElementById("mensagem").value.trim();

        // Verifica cada campo e para na primeira falha
        if (!nome) {
            mostrarErro("Nome é obrigatório.");
            return;
        }

        if (!email || !email.includes("@")) {
            mostrarErro("E-mail inválido.");
            return;
        }

        if (!mensagem) {
            mostrarErro("Mensagem obrigatória.");
            return;
        }

        formulario.reset();
        mostrarSucesso("Mensagem enviada! Bem-vindo à missão AURORA.");
    });
}
// Função do quiz — renderiza as perguntas dinamicamente e controla a pontuação
function iniciarQuiz() {
    const container = document.getElementById("quiz-container");

    if (!container) return;

    // Array com as 10 perguntas — cada objeto tem pergunta, alternativas e índice da correta
    const perguntas = [
        {
            pergunta: "Quanto tempo dura a noite lunar em dias na Terra?",
            alternativas: ["1 dia", "14 dias", "5 dias", "16 dias"],
            correta: 1
        },
        {
            pergunta: "Qual é o ODS primário da AURORA?",
            alternativas: ["ODS 4", "ODS 7", "ODS 9", "ODS 15"],
            correta: 2
        },
        {
            pergunta: "Qual sensor simula o Sol no circuito?",
            alternativas: ["LDR", "Servo motor", "LED", "Buzzer"],
            correta: 0
        },
        {
            pergunta: "Qual erro famoso da Apollo 11 inspira a AURORA?",
            alternativas: ["Alarme 1202", "Erro 404", "Falha 500", "Código 13"],
            correta: 0
        },
        {
            pergunta: "Qual função modela a descarga da bateria?",
            alternativas: ["Linear", "Quadrática", "Exponencial", "Logarítmica"],
            correta: 2
        },
        {
            pergunta: "O que o sistema corta primeiro em emergência?",
            alternativas: ["Suporte à vida", "Comunicação principal", "Cargas não essenciais", "Sensores críticos"],
            correta: 2
        },
        {
            pergunta: "Qual o tamanho estimado da economia espacial global até 2030?",
            alternativas: ["US$ 1 bilhão", "US$ 100 bilhões", "Aproximadamente US$ 1 trilhão", "US$ 10 trilhões"],
            correta: 2
        },
        {
            pergunta: "Qual programa da NASA promove o retorno humano à Lua?",
            alternativas: ["Apollo", "Artemis", "Gemini", "Mercury"],
            correta: 1
        },
        {
            pergunta: "Qual atuador corta a carga fisicamente no circuito?",
            alternativas: ["LDR", "Buzzer", "Servo motor", "Display LCD"],
            correta: 2
        },
        {
            pergunta: "Qual aplicação da AURORA existe na Terra?",
            alternativas: ["Rede social", "Microgrid off-grid", "Marketplace", "Streaming de vídeo"],
            correta: 1
        },
    ];

    let perguntaAtual = 0; // Controla qual pergunta está sendo exibida
    let pontuacao = 0;     // Conta quantas respostas certas o usuário deu

    // Renderiza a pergunta atual no HTML com seus botões de alternativa
    function mostrarPergunta() {
        const item = perguntas[perguntaAtual];
        container.innerHTML = `
            <p>Pergunta ${perguntaAtual + 1} de ${perguntas.length}</p>
            <h3>${item.pergunta}</h3>
            <div class="quiz__alternativas"></div>
        `;
        const areaAlternativas = container.querySelector(".quiz__alternativas");
        item.alternativas.forEach(function (alternativa, indice) {
            const botao = document.createElement("button");
            botao.type = "button";
            botao.textContent = alternativa;
            botao.classList.add("quiz__alternativa");
            botao.addEventListener("click", function () {
                responder(indice, botao);
            });
            areaAlternativas.appendChild(botao);
        });
    }

    // Verifica se a resposta está certa e mostra feedback visual (verde ou vermelho)
    function responder(indiceEscolhido, botaoEscolhido) {
        const indiceCorreto = perguntas[perguntaAtual].correta;
        const botoes = container.querySelectorAll(".quiz__alternativa");

        botoes.forEach(function (botao) {
            botao.disabled = true;
        });

        if (indiceEscolhido === indiceCorreto) {
            botaoEscolhido.classList.add("correta");
            pontuacao++;
        } else {
            botaoEscolhido.classList.add("errada");
            botoes[indiceCorreto].classList.add("correta");
        }

        setTimeout(function () {
            perguntaAtual++;

            if (perguntaAtual < perguntas.length) {
                mostrarPergunta();
            } else {
                mostrarResultado();
            }
        }, 1000);
    }

    // Exibe a pontuação final e o botão para reiniciar o quiz do zero
    function mostrarResultado() {
        container.innerHTML = `
            <h3>Resultado final</h3>
            <p>Você acertou ${pontuacao} de ${perguntas.length} perguntas.</p>
            <button type="button" id="reiniciar-quiz" class="quiz__alternativa">Reiniciar Quiz</button>
        `;

        document.getElementById("reiniciar-quiz").addEventListener("click", function () {
            perguntaAtual = 0;
            pontuacao = 0;
            mostrarPergunta();
        });
    }

    mostrarPergunta();
}
