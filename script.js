/* =========================================================
   SATFINDER BRASIL
   SCRIPT.JS — V1
   ========================================================= */

/*
  IMPORTANTE:
  - A consulta de CEP usa o ViaCEP.
  - Os dados de preço/plano abaixo são apenas referências
    do comparador.
  - A disponibilidade final deve ser confirmada no
    provedor oficial.
*/


/* =========================================================
   CONFIGURAÇÃO
========================================================= */

const CONFIG = {

  viacep: "https://viacep.com.br/ws",

  timeout: 10000,

  providers: [

    {
      id: "starlink",

      name: "Starlink",

      badge: "Alta velocidade",

      price: "Consulte",

      speed: "Consulte o plano",

      data: "Conforme plano",

      installation: "Consulte",

      profiles: [
        "residencial",
        "rural",
        "empresa",
        "viagem"
      ],

      url: "https://www.starlink.com/br"
    },


    {
      id: "hughesnet",

      name: "Hughesnet",

      badge: "Internet rural",

      price: "Consulte",

      speed: "Consulte o plano",

      data: "Conforme plano",

      installation: "Consulte",

      profiles: [
        "residencial",
        "rural",
        "empresa"
      ],

      url: "https://www.hughesnet.com.br/"
    },


    {
      id: "viasat",

      name: "Viasat",

      badge: "Residencial",

      price: "Consulte",

      speed: "Consulte o plano",

      data: "Conforme plano",

      installation: "Consulte",

      profiles: [
        "residencial",
        "rural"
      ],

      url: "https://www.viasat.com/pt-br/"
    }

  ]

};


/* =========================================================
   ELEMENTOS
========================================================= */

const form =
  document.getElementById("searchForm");

const cepInput =
  document.getElementById("cep");

const profileInput =
  document.getElementById("profile");

const statusElement =
  document.getElementById("searchStatus");

const addressCard =
  document.getElementById("addressCard");

const addressTitle =
  document.getElementById("addressTitle");

const addressDetails =
  document.getElementById("addressDetails");

const resultsGrid =
  document.getElementById("resultsGrid");

const resultCount =
  document.getElementById("resultCount");


/* =========================================================
   MÁSCARA DE CEP
========================================================= */

cepInput.addEventListener("input", function () {

  let value =
    this.value.replace(/\D/g, "");

  if (value.length > 8) {
    value = value.substring(0, 8);
  }

  if (value.length > 5) {

    value =
      value.substring(0, 5) +
      "-" +
      value.substring(5);

  }

  this.value = value;

});


/* =========================================================
   SUBMIT
========================================================= */

form.addEventListener("submit", async function (event) {

  event.preventDefault();

  const cep =
    normalizeCep(cepInput.value);

  const profile =
    profileInput.value;


  /* ---------------------------------------------
     VALIDAÇÃO
  --------------------------------------------- */

  if (!isValidCep(cep)) {

    showStatus(
      "Digite um CEP válido com 8 números.",
      "error"
    );

    cepInput.focus();

    return;
  }


  /* ---------------------------------------------
     LOADING
  --------------------------------------------- */

  setLoading(true);

  hideAddress();

  showLoading();


  try {

    showStatus(
      "Consultando o endereço...",
      "loading"
    );


    /* ---------------------------------------------
       CONSULTA API
    --------------------------------------------- */

    const address =
      await getAddressByCep(cep);


    /* ---------------------------------------------
       CEP NÃO ENCONTRADO
    --------------------------------------------- */

    if (!address || address.erro) {

      throw new Error(
        "CEP não encontrado."
      );

    }


    /* ---------------------------------------------
       MOSTRA ENDEREÇO
    --------------------------------------------- */

    showAddress(address);


    showStatus(
      "Localização encontrada. Montando comparação...",
      "success"
    );


    /* ---------------------------------------------
       RESULTADOS
    --------------------------------------------- */

    const providers =
      getProvidersByProfile(profile);


    renderProviders(
      providers,
      address
    );


    resultCount.textContent =
      `${providers.length} opções encontradas`;


    /* ---------------------------------------------
       ROLAGEM
    --------------------------------------------- */

    setTimeout(() => {

      document
        .getElementById("resultados")
        .scrollIntoView({
          behavior: "smooth"
        });

    }, 300);


  } catch (error) {

    console.error(
      "SatFinder:",
      error
    );


    renderError(
      error.message
    );


    showStatus(
      error.message ||
      "Não foi possível realizar a consulta.",
      "error"
    );

  } finally {

    setLoading(false);

  }

});


/* =========================================================
   CONSULTAR CEP
========================================================= */

async function getAddressByCep(cep) {

  const controller =
    new AbortController();


  const timeout =
    setTimeout(
      () => controller.abort(),
      CONFIG.timeout
    );


  try {

    const response =
      await fetch(
        `${CONFIG.viacep}/${cep}/json/`,
        {
          method: "GET",

          headers: {
            "Accept": "application/json"
          },

          signal: controller.signal
        }
      );


    if (!response.ok) {

      throw new Error(
        "O serviço de CEP não respondeu corretamente."
      );

    }


    const data =
      await response.json();


    return data;


  } catch (error) {

    if (
      error.name ===
      "AbortError"
    ) {

      throw new Error(
        "A consulta demorou demais. Tente novamente."
      );

    }


    throw new Error(
      "Não foi possível consultar o CEP. Verifique sua conexão."
    );

  } finally {

    clearTimeout(timeout);

  }

}


/* =========================================================
   NORMALIZAR CEP
========================================================= */

function normalizeCep(value) {

  return String(value)
    .replace(/\D/g, "")
    .substring(0, 8);

}


/* =========================================================
   VALIDAR CEP
========================================================= */

function isValidCep(cep) {

  return /^\d{8}$/.test(cep);

}


/* =========================================================
   MOSTRAR ENDEREÇO
========================================================= */

function showAddress(address) {

  const street =
    address.logradouro ||
    "Endereço não informado";


  const neighborhood =
    address.bairro ||
    "Bairro não informado";


  const city =
    address.localidade ||
    "Cidade não informada";


  const state =
    address.uf ||
    "";


  addressTitle.textContent =
    `${city} - ${state}`;


  addressDetails.textContent =
    `${street} • ${neighborhood} • CEP ${formatCep(address.cep)}`;


  addressCard.classList.remove(
    "hidden"
  );

}


/* =========================================================
   ESCONDER ENDEREÇO
========================================================= */

function hideAddress() {

  addressCard.classList.add(
    "hidden"
  );

}


/* =========================================================
   FORMATAR CEP
========================================================= */

function formatCep(cep) {

  const clean =
    normalizeCep(cep);


  if (clean.length !== 8) {
    return cep || "";
  }


  return (
    clean.substring(0, 5) +
    "-" +
    clean.substring(5)
  );

}


/* =========================================================
   FILTRAR PROVEDORES
========================================================= */

function getProvidersByProfile(profile) {

  return CONFIG.providers.filter(
    provider =>
      provider.profiles.includes(profile)
  );

}


/* =========================================================
   RENDERIZAR PROVEDORES
========================================================= */

function renderProviders(
  providers,
  address
) {

  if (!providers.length) {

    resultsGrid.innerHTML = `
      <div class="empty-results">

        <div class="empty-icon">
          📡
        </div>

        <h3>
          Nenhuma opção encontrada
        </h3>

        <p>
          Não encontramos provedores cadastrados
          para esse perfil.
        </p>

      </div>
    `;

    return;
  }


  resultsGrid.innerHTML =
    providers
      .map(
        (provider, index) =>
          createProviderCard(
            provider,
            address,
            index === 0
          )
      )
      .join("");


  /*
    Observação:
    O comparador não afirma disponibilidade real.
    A confirmação é feita pelo provedor.
  */

  resultsGrid.innerHTML += `

    <div
      style="
        grid-column:1/-1;
        margin-top:4px;
        color:#718da3;
        font-size:12px;
      "
    >

      📍 Região consultada:
      ${escapeHtml(address.localidade)}
      -
      ${escapeHtml(address.uf)}

      <br>

      ⚠️ A disponibilidade final depende
      da análise do endereço pelo provedor.

    </div>

  `;

}


/* =========================================================
   CARD
========================================================= */

function createProviderCard(
  provider,
  address,
  recommended
) {

  const recommendation =
    recommended
      ? `<span class="plan-badge">
           ⭐ Opção para comparar
         </span>`
      : `<span class="plan-badge">
           Disponível para consulta
         </span>`;


  const city =
    escapeHtml(
      address.localidade
    );


  const state =
    escapeHtml(
      address.uf
    );


  return `

    <article
      class="plan-card ${
        recommended
          ? "recommended"
          : ""
      }"
    >

      ${recommendation}


      <h3>
        ${escapeHtml(provider.name)}
      </h3>


      <div class="plan-provider">
        Internet via satélite
      </div>


      <div class="plan-price">

        ${escapeHtml(provider.price)}

        <small>
          / mês
        </small>

      </div>


      <div class="plan-specs">

        <span>
          ⚡ Velocidade:
          ${escapeHtml(provider.speed)}
        </span>

        <span>
          📦 Dados:
          ${escapeHtml(provider.data)}
        </span>

        <span>
          🔧 Instalação:
          ${escapeHtml(provider.installation)}
        </span>

        <span>
          📍 Região:
          ${city} - ${state}
        </span>

      </div>


      <a
        class="plan-button"
        href="${provider.url}"
        target="_blank"
        rel="noopener noreferrer"
      >
        Confirmar no site oficial ↗
      </a>

    </article>

  `;

}


/* =========================================================
   LOADING
========================================================= */

function showLoading() {

  resultsGrid.innerHTML = `

    <div class="loading">

      <div class="spinner"></div>

      Consultando opções...

    </div>

  `;


  resultCount.textContent =
    "Consultando...";
}


/* =========================================================
   LOADING DO BOTÃO
========================================================= */

function setLoading(
  loading
) {

  const button =
    form.querySelector(
      ".search-button"
    );


  if (!button) {
    return;
  }


  button.disabled =
    loading;


  if (loading) {

    button.dataset.originalText =
      button.textContent;

    button.textContent =
      "⏳ Consultando...";

  } else {

    button.textContent =
      button.dataset.originalText ||
      "🔎 Encontrar internet";

  }

}


/* =========================================================
   STATUS
========================================================= */

function showStatus(
  message,
  type = ""
) {

  statusElement.textContent =
    message;


  statusElement.className =
    "search-status";


  if (type) {

    statusElement.classList.add(
      type
    );

  }

}


/* =========================================================
   ERRO
========================================================= */

function renderError(
  message
) {

  resultsGrid.innerHTML = `

    <div class="empty-results">

      <div class="empty-icon">
        ⚠️
      </div>

      <h3>
        Não foi possível concluir a busca
      </h3>

      <p>
        ${escapeHtml(message)}
      </p>

    </div>

  `;


  resultCount.textContent =
    "Erro na consulta";

}


/* =========================================================
   SEGURANÇA
========================================================= */

function escapeHtml(value) {

  return String(value ?? "")
    .replace(
      /[&<>"']/g,
      character => {

        const entities = {

          "&": "&amp;",

          "<": "&lt;",

          ">": "&gt;",

          '"': "&quot;",

          "'": "&#039;"

        };


        return entities[
          character
        ];

      }
    );

}


/* =========================================================
   TESTE INICIAL
========================================================= */

console.log(
  "🛰️ SatFinder Brasil iniciado."
);
