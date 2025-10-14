import { MARKETS } from "./markets.js";

document.addEventListener("DOMContentLoaded", () => {
  const getQueryParam = (name) => {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  };

  const detectByHost = () => {
    const host = window.location.hostname.toLowerCase();
    if (host.endsWith(".com.br")) return "BR";
    if (host.endsWith(".com.co")) return "CO";
    if (host.endsWith(".cl")) return "CL";
    if (host.endsWith(".com.uy")) return "UY";
    if (host.endsWith(".com.mx")) return "MX";
    return null;
  };

  const detectByNavigator = () => {
    const navLang = (
      navigator.language ||
      navigator.userLanguage ||
      "pt-BR"
    ).toUpperCase();
    const region = navLang.split("-")[1] || "";
    const supported = ["BR", "CO", "CL", "UY", "MX"];
    return supported.includes(region) ? region : null;
  };

  const detectMarket = () => {
    const qp = (getQueryParam("country") || "").toUpperCase();
    if (MARKETS[qp]) return qp;
    const byHost = detectByHost();
    if (MARKETS[byHost]) return byHost;
    const byNav = detectByNavigator();
    if (MARKETS[byNav]) return byNav;
    return "BR";
  };

  const MARKET_CODE = detectMarket();
  const MARKET = MARKETS[MARKET_CODE];

  document.documentElement.lang = MARKET.locale;

  const priceInput = document.getElementById("price");
  const resaleInput = document.getElementById("resale");
  const discountInput = document.getElementById("discount");
  const profitMarginText = document.getElementById("profit-margin-text");
  const finalPriceValue = document.getElementById("final-price-value");
  const discountPercentageText = document.getElementById(
    "discount-percentage-text"
  );
  const titleEl = document.querySelector("main h1");
  const selectType = document.getElementById("descont-type");
  const optionFidelity = selectType
    ? selectType.querySelector('option[value="fidelity"]')
    : null;
  const optionSecond = selectType
    ? selectType.querySelector('option[value="second-unit"]')
    : null;
  const priceLabel = document.getElementById("price-label");
  const resaleLabel = document.querySelector('label[for="resale"]');
  const discountLabel = document.getElementById("discount-label");
  const finalPriceLabel = document.getElementById("final-price-label");
  const profitLabel = document.querySelector(".profit .label-group label");
  const howToBtn = document.querySelector("button");

  let currencyFormatter = new Intl.NumberFormat(MARKET.locale, {
    style: "currency",
    currency: MARKET.currency,
  });
  const currencyOptions = currencyFormatter.resolvedOptions();
  const fractionDigits = currencyOptions.maximumFractionDigits;
  const SCALE = Math.pow(10, fractionDigits);

  const formatAsCurrency = (input) => {
    let digits = input.value.replace(/\D/g, "");
    if (digits === "") {
      input.value = "";
      return;
    }
    let numeric = parseInt(digits, 10) / SCALE;
    input.value = currencyFormatter.format(numeric);
  };

  const parseCurrency = (formatted) => {
    if (!formatted) return 0;
    const digits = formatted.replace(/\D/g, "");
    if (digits === "") return 0;
    return parseInt(digits, 10) / SCALE;
  };

  const formatCurrencyToHTML = (value) => {
    const parts = new Intl.NumberFormat(MARKET.locale, {
      style: "currency",
      currency: MARKET.currency,
    }).formatToParts(value);

    return parts
      .map((part) => {
        switch (part.type) {
          case "fraction":
            return `<span>${part.value}</span>`;
          case "group":
          case "decimal":
            return ""; 
          default:
            return part.value; 
        }
      })
      .join("");
  };

  const applyTranslations = () => {
    const t = MARKET.texts;
    if (titleEl) titleEl.textContent = t.title;
    if (optionFidelity) optionFidelity.textContent = t.discountTypeFidelity;
    if (optionSecond) optionSecond.textContent = t.discountTypeSecondUnit;
    if (priceLabel) priceLabel.textContent = t.priceLabel;
    if (resaleLabel) resaleLabel.textContent = t.resaleLabel;
    if (discountLabel) discountLabel.textContent = t.discountLabel;
    if (finalPriceLabel) finalPriceLabel.textContent = t.finalPriceLabel;
    if (profitLabel) profitLabel.textContent = t.marginLabel;
    if (howToBtn) howToBtn.textContent = t.howToUse;
    const ph = currencyFormatter.format(0);
    if (priceInput) priceInput.placeholder = ph;
    if (resaleInput) resaleInput.placeholder = ph;
    if (discountInput) discountInput.placeholder = ph;
  };

  const calculateAndupdateUI = () => {
    const grossValue = parseCurrency(priceInput.value);
    const resaleValue = parseCurrency(resaleInput.value);
    const discountValue = parseCurrency(discountInput.value);
    let finalPrice = resaleValue - discountValue;
    if (finalPrice < 0) finalPrice = 0;
    let discountPercentage = 0;
    if (grossValue > 0) {
      discountPercentage = (discountValue / resaleValue) * 100;
    }
    let profitMarginPercentage = 0;
    if (resaleValue > 0) {
      const profit = resaleValue - grossValue;
      profitMarginPercentage = (profit / resaleValue) * 100;
    }
    let marginText = "--";
    let marginClass = "";
    if (resaleValue > 0 && grossValue > 0) {
      if (profitMarginPercentage > 40) {
        marginText = MARKET.texts.marginHigh;
        marginClass = "profit-high";
      } else if (profitMarginPercentage >= 20) {
        marginText = MARKET.texts.marginMedium;
        marginClass = "profit-medium";
      } else {
        marginText = MARKET.texts.marginLow;
        marginClass = "profit-low";
      }
    }
    profitMarginText.textContent = marginText;
    profitMarginText.className = marginClass;
    finalPriceValue.innerHTML = formatCurrencyToHTML(finalPrice);
    if (discountPercentage > 0) {
      discountPercentageText.textContent = MARKET.texts.discountWith(
        Math.round(discountPercentage)
      );
    } else {
      discountPercentageText.textContent = MARKET.texts.discountPlaceholder;
    }
  };

  const handleInput = (inputElement) => {
    formatAsCurrency(inputElement);
    calculateAndupdateUI();
  };

  applyTranslations();
  priceInput.addEventListener("input", () => handleInput(priceInput));
  resaleInput.addEventListener("input", () => handleInput(resaleInput));
  discountInput.addEventListener("input", () => handleInput(discountInput));
  calculateAndupdateUI();
});
