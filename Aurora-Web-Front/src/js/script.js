console.log("JavaScript carregado com sucesso!");
iniciarTemas();
//iniciarSlideshow();
iniciarFormulario();
//iniciarQuiz();

function iniciarTemas() {
    const pagina = document.querySelector(".page-wrapper");
    const botoesTema = document.querySelectorAll('input[name="tema"]');

    const temas = {
        "tema-dia": {
            bg: "#080D1A",
            navy: "#0D1B2E",
            amber: "#FF7A33",
        },
        "tema-noite": {
            bg: "#000510",
            navy: "#000B18",
            amber: "#00C9FF",
        },
        "tema-alerta": {
            bg: "#1A0000",
            navy: "#0D0000",
            amber: "#FF4444",
        },
    };

    function trocarTema(idTema) {
        const tema = temas[idTema];

        pagina.style.setProperty("--bg", tema.bg);
        pagina.style.setProperty("--navy", tema.navy);
        pagina.style.setProperty("--amber", tema.amber);
    }

    botoesTema.forEach(function (botao) {
        botao.addEventListener("change", function () {
            trocarTema(botao.id);
        });
    });
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
