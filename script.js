const STORAGE_KEYS = {
  jobs: "worklink-lite-jobs",
  services: "worklink-lite-services",
  auth: "worklink-lite-auth",
  saved: "worklink-lite-saved",
  activity: "worklink-lite-activity",
  records: "worklink-lite-records",
  conversations: "worklink-lite-conversations",
  recent: "worklink-lite-recent",
  theme: "worklink-lite-theme",
  draftJob: "worklink-lite-draft-job",
  draftService: "worklink-lite-draft-service",
};

const JOB_SEED = [
  {
    id: "job-1",
    title: "Weekend Math Tutor",
    description: "Help two middle school students prepare for exams with a friendly Saturday session.",
    category: "Tutoring",
    location: "Austin, TX",
    status: "Open",
    createdAt: "2026-04-11T08:00:00.000Z",
    ownerName: "Maya Coleman",
    ownerEmail: "maya.coleman@worklink.demo",
    isUserCreated: false,
  },
  {
    id: "job-2",
    title: "Event Setup Assistant",
    description: "Support a neighborhood startup fair with booth setup, signage placement, and logistics.",
    category: "Events",
    location: "Dallas, TX",
    status: "Open",
    createdAt: "2026-04-11T08:30:00.000Z",
    ownerName: "Jordan Brooks",
    ownerEmail: "jordan.brooks@worklink.demo",
    isUserCreated: false,
  },
  {
    id: "job-3",
    title: "Garden Cleanup Help",
    description: "Trim hedges, sweep leaves, and refresh a small front yard ahead of a family gathering.",
    category: "Home Help",
    location: "Houston, TX",
    status: "Closed",
    createdAt: "2026-04-11T09:00:00.000Z",
    ownerName: "Elena Foster",
    ownerEmail: "elena.foster@worklink.demo",
    isUserCreated: false,
  },
  {
    id: "job-4",
    title: "Laptop Setup Support",
    description: "Assist a small business owner with software installs, Wi-Fi setup, and file organization.",
    category: "Tech Support",
    location: "San Antonio, TX",
    status: "Open",
    createdAt: "2026-04-11T09:30:00.000Z",
    ownerName: "Chris Navarro",
    ownerEmail: "chris.navarro@worklink.demo",
    isUserCreated: false,
  },
];

const SERVICE_SEED = [
  {
    id: "service-1",
    title: "Phone Screen Repair",
    description: "Same-day repair service for cracked screens, charging ports, and battery replacement.",
    category: "Repairs",
    provider: "Amara Tech Care",
    status: "Available",
    createdAt: "2026-04-11T08:15:00.000Z",
    ownerName: "Amara Tech Care",
    ownerEmail: "amara@worklink.demo",
    isUserCreated: false,
  },
  {
    id: "service-2",
    title: "Beginner Graphic Design Help",
    description: "Flyers, social graphics, and simple branding packages for students and local shops.",
    category: "Design",
    provider: "Nico Alvarez",
    status: "Available",
    createdAt: "2026-04-11T08:45:00.000Z",
    ownerName: "Nico Alvarez",
    ownerEmail: "nico.alvarez@worklink.demo",
    isUserCreated: false,
  },
  {
    id: "service-3",
    title: "Moving Day Support",
    description: "Reliable local help for packing, loading, and organizing small apartment moves.",
    category: "Moving",
    provider: "Lift & Go Crew",
    status: "Paused",
    createdAt: "2026-04-11T09:15:00.000Z",
    ownerName: "Lift & Go Crew",
    ownerEmail: "liftandgo@worklink.demo",
    isUserCreated: false,
  },
  {
    id: "service-4",
    title: "Home Deep Cleaning",
    description: "Detailed room-by-room cleaning for apartments, dorms, and small offices.",
    category: "Cleaning",
    provider: "Sanaa Home Care",
    status: "Available",
    createdAt: "2026-04-11T09:45:00.000Z",
    ownerName: "Sanaa Home Care",
    ownerEmail: "sanaa@worklink.demo",
    isUserCreated: false,
  },
];

const ui = {
  listingRenderers: [],
};

const appState = {
  mode: "Local Mode",
  theme: "warm",
};

const SEEDED_LOOKUP = new Map(
  [...JOB_SEED, ...SERVICE_SEED].map((item) => [item.id, item])
);

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getDefaultStatus(type) {
  return type === "jobs" ? "Open" : "Available";
}

function normalizeItem(type, item) {
  const seeded = SEEDED_LOOKUP.get(item.id) || {};
  return {
    ...item,
    status: item.status || getDefaultStatus(type),
    createdAt: item.createdAt || new Date().toISOString(),
    ownerName: item.ownerName || seeded.ownerName || (type === "services" ? item.provider || "Service provider" : "Job owner"),
    ownerEmail: item.ownerEmail || seeded.ownerEmail || "",
    isUserCreated: Boolean(item.isUserCreated),
  };
}

function normalizeConversation(conversation) {
  const participants = Array.isArray(conversation.participants) ? conversation.participants : [];
  const seededListing = SEEDED_LOOKUP.get(conversation.listingId) || {};
  const requesterEmail = conversation.requesterEmail || conversation.actorEmail || "";
  const requesterName = conversation.requesterName || conversation.actorName || "Guest";
  const recipientEmail = conversation.recipientEmail || seededListing.ownerEmail || "";
  const recipientName = conversation.recipientName || conversation.targetName || seededListing.ownerName || "Contact";

  return {
    ...conversation,
    requesterEmail,
    requesterName,
    recipientEmail,
    recipientName,
    participants: participants.length
      ? participants
      : [
          { email: requesterEmail, name: requesterName, role: "requester" },
          { email: recipientEmail, name: recipientName, role: "recipient" },
        ].filter((item) => item.email || item.name),
    messages: Array.isArray(conversation.messages)
      ? conversation.messages.map((message) => ({
          ...message,
          senderEmail: message.senderEmail || "",
          senderRole: message.senderRole || "user",
        }))
      : [],
  };
}

function ensureData() {
  const jobs = readStorage(STORAGE_KEYS.jobs, []);
  const services = readStorage(STORAGE_KEYS.services, []);
  const saved = readStorage(STORAGE_KEYS.saved, []);
  const activity = readStorage(STORAGE_KEYS.activity, []);
  const records = readStorage(STORAGE_KEYS.records, []);
  const conversations = readStorage(STORAGE_KEYS.conversations, []);
  const recent = readStorage(STORAGE_KEYS.recent, []);

  if (!jobs.length) {
    writeStorage(STORAGE_KEYS.jobs, JOB_SEED);
  } else {
    writeStorage(STORAGE_KEYS.jobs, jobs.map((item) => normalizeItem("jobs", item)));
  }

  if (!services.length) {
    writeStorage(STORAGE_KEYS.services, SERVICE_SEED);
  } else {
    writeStorage(STORAGE_KEYS.services, services.map((item) => normalizeItem("services", item)));
  }

  if (!Array.isArray(saved)) {
    writeStorage(STORAGE_KEYS.saved, []);
  }

  if (!Array.isArray(activity)) {
    writeStorage(STORAGE_KEYS.activity, []);
  }

  if (!Array.isArray(records)) {
    writeStorage(STORAGE_KEYS.records, []);
  }

  if (!Array.isArray(conversations)) {
    writeStorage(STORAGE_KEYS.conversations, []);
  } else {
    writeStorage(
      STORAGE_KEYS.conversations,
      conversations.map((conversation) => normalizeConversation(conversation))
    );
  }

  if (!Array.isArray(recent)) {
    writeStorage(STORAGE_KEYS.recent, []);
  }
}

function getJobs() {
  return readStorage(STORAGE_KEYS.jobs, JOB_SEED).map((item) => normalizeItem("jobs", item));
}

function getServices() {
  return readStorage(STORAGE_KEYS.services, SERVICE_SEED).map((item) => normalizeItem("services", item));
}

function getAuth() {
  return readStorage(STORAGE_KEYS.auth, null);
}

function getSaved() {
  return readStorage(STORAGE_KEYS.saved, []);
}

function getActivity() {
  return readStorage(STORAGE_KEYS.activity, []);
}

function getRecords() {
  return readStorage(STORAGE_KEYS.records, []);
}

function getRecent() {
  return readStorage(STORAGE_KEYS.recent, []);
}

function getConversations() {
  return readStorage(STORAGE_KEYS.conversations, []).map((conversation) => normalizeConversation(conversation));
}

function setAuth(user) {
  writeStorage(STORAGE_KEYS.auth, user);
}

function clearAuth() {
  localStorage.removeItem(STORAGE_KEYS.auth);
}

function getCollection(type) {
  return type === "jobs" ? getJobs() : getServices();
}

function setConversations(items) {
  writeStorage(STORAGE_KEYS.conversations, items.map((conversation) => normalizeConversation(conversation)));
}

function setCollection(type, items) {
  const key = type === "jobs" ? STORAGE_KEYS.jobs : STORAGE_KEYS.services;
  writeStorage(key, items.map((item) => normalizeItem(type, item)));
}

function sortByNewest(items) {
  return [...items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function createId(prefix) {
  return `${prefix}-${Date.now()}`;
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function recordActivity(label, detail) {
  const next = [
    {
      id: createId("activity"),
      label,
      detail,
      createdAt: new Date().toISOString(),
    },
    ...getActivity(),
  ].slice(0, 12);

  writeStorage(STORAGE_KEYS.activity, next);
}

function recordInteraction(type, item, action) {
  const auth = getAuth();
  const next = [
    {
      id: createId("record"),
      action,
      listingType: type,
      listingTitle: item.title,
      actorName: auth?.name || "Guest",
      createdAt: new Date().toISOString(),
      status: "Recorded",
    },
    ...getRecords(),
  ].slice(0, 12);

  writeStorage(STORAGE_KEYS.records, next);
}

function recordRecentView(type, item) {
  const next = [
    {
      id: item.id,
      type,
      title: item.title,
      createdAt: new Date().toISOString(),
    },
    ...getRecent().filter((entry) => !(entry.id === item.id && entry.type === type)),
  ].slice(0, 8);

  writeStorage(STORAGE_KEYS.recent, next);
}

function getRequestTargetName(type, item) {
  if (type === "jobs") {
    return item.ownerName || "Job owner";
  }

  return item.provider || item.ownerName || "Service provider";
}

function getRequestTargetEmail(item) {
  return item.ownerEmail || "";
}

function getConversationLabel(conversation) {
  return conversation.kind === "hire" ? "Hire request" : "Job application";
}

function getConversationSummary(conversation) {
  const auth = getAuth();
  const isRequester = Boolean(auth && auth.email === conversation.requesterEmail);
  const target = isRequester ? conversation.recipientName : conversation.requesterName;
  return `${getConversationLabel(conversation)} with ${target || "Contact"}`;
}

function createConversation(type, item, payload) {
  const auth = getAuth();

  if (!auth) {
    return null;
  }

  const conversation = {
    id: createId("conversation"),
    kind: payload.kind,
    listingType: type,
    listingId: item.id,
    listingTitle: item.title,
    listingCategory: item.category,
    targetName: getRequestTargetName(type, item),
    actorName: auth.name,
    actorEmail: auth.email,
    requesterName: auth.name,
    requesterEmail: auth.email,
    recipientName: getRequestTargetName(type, item),
    recipientEmail: getRequestTargetEmail(item),
    budget: payload.budget || "",
    preferredDate: payload.preferredDate || "",
    status: "Pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    participants: [
      { email: auth.email, name: auth.name, role: "requester" },
      { email: getRequestTargetEmail(item), name: getRequestTargetName(type, item), role: "recipient" },
    ].filter((participant) => participant.email || participant.name),
    messages: [
      {
        id: createId("message"),
        sender: auth.name,
        senderEmail: auth.email,
        senderRole: "user",
        text: payload.message,
        createdAt: new Date().toISOString(),
      },
    ],
  };

  setConversations([conversation, ...getConversations()]);
  return conversation;
}

function findConversation(id) {
  return getConversations().find((item) => item.id === id) || null;
}

function appendConversationMessage(conversationId, text) {
  const auth = getAuth();
  if (!auth) {
    return null;
  }

  const nextItems = getConversations().map((conversation) => {
    if (conversation.id !== conversationId) {
      return conversation;
    }

    return {
      ...conversation,
      updatedAt: new Date().toISOString(),
      messages: [
        ...conversation.messages,
        {
          id: createId("message"),
          sender: auth.name,
          senderEmail: auth.email,
          senderRole: auth.email === conversation.requesterEmail ? "requester" : "recipient",
          text,
          createdAt: new Date().toISOString(),
        },
      ],
    };
  });

  setConversations(nextItems);
  return findConversation(conversationId);
}

function getSavedCount() {
  return getSaved().length;
}

function getProfileStats() {
  const auth = getAuth();
  const jobs = getJobs();
  const services = getServices();
  const saved = getSaved();
  const records = getRecords();
  const conversations = getConversations();

  const myJobs = auth ? jobs.filter((item) => item.ownerEmail === auth.email).length : 0;
  const myServices = auth ? services.filter((item) => item.ownerEmail === auth.email).length : 0;

  return {
    posts: myJobs + myServices,
    jobs: myJobs,
    services: myServices,
    saved: saved.length,
    records: records.length,
    conversations: auth ? conversations.filter((item) =>
      item.participants.some((participant) => participant.email === auth.email)
    ).length : 0,
  };
}

function updateStatCards() {
  const jobs = getJobs();
  const services = getServices();
  const records = getRecords();

  document.querySelectorAll("[data-stat]").forEach((node) => {
    const type = node.dataset.stat;

    if (type === "jobs") {
      node.textContent = jobs.length;
    }

    if (type === "services") {
      node.textContent = services.length;
    }

    if (type === "categories") {
      const categories = new Set([
        ...jobs.map((item) => item.category),
        ...services.map((item) => item.category),
      ]);
      node.textContent = categories.size;
    }

    if (type === "saved") {
      node.textContent = getSavedCount();
    }

    if (type === "records") {
      node.textContent = records.length;
    }
  });
}

function showNotice(target, message, variant = "success") {
  if (!target) {
    return;
  }

  target.textContent = message;
  target.classList.remove("is-hidden", "is-success", "is-error");
  target.classList.add(variant === "error" ? "is-error" : "is-success");

  window.clearTimeout(showNotice.timeoutId);
  showNotice.timeoutId = window.setTimeout(() => {
    target.textContent = "";
    target.classList.add("is-hidden");
    target.classList.remove("is-success", "is-error");
  }, 3200);
}

function getSavedEntry(type, id) {
  return getSaved().find((item) => item.type === type && item.id === id);
}

function isSaved(type, id) {
  return Boolean(getSavedEntry(type, id));
}

function toggleSaved(type, item) {
  const saved = getSaved();
  const exists = saved.find((entry) => entry.type === type && entry.id === item.id);

  if (exists) {
    writeStorage(
      STORAGE_KEYS.saved,
      saved.filter((entry) => !(entry.type === type && entry.id === item.id))
    );
    recordActivity("Removed saved listing", item.title);
    return false;
  }

  writeStorage(STORAGE_KEYS.saved, [
    {
      id: item.id,
      type,
    },
    ...saved,
  ]);
  recordActivity("Saved listing", item.title);
  return true;
}

function canManageItem(item) {
  const auth = getAuth();
  return Boolean(auth && item.ownerEmail && auth.email === item.ownerEmail);
}

function findItem(type, id) {
  return getCollection(type).find((item) => item.id === id) || null;
}

function updateItem(type, updatedItem) {
  const nextItems = getCollection(type).map((item) =>
    item.id === updatedItem.id ? normalizeItem(type, updatedItem) : item
  );
  setCollection(type, nextItems);
}

function deleteItem(type, id) {
  setCollection(
    type,
    getCollection(type).filter((item) => item.id !== id)
  );
  writeStorage(
    STORAGE_KEYS.saved,
    getSaved().filter((entry) => !(entry.type === type && entry.id === id))
  );
}

function getFilteredItems(items, searchTerm, category, type) {
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const normalizedCategory = category.toLowerCase();

  return items.filter((item) => {
    const fields = type === "jobs"
      ? [item.title, item.description, item.category, item.location, item.status]
      : [item.title, item.description, item.category, item.provider, item.status];

    const matchesSearch = !normalizedSearch || fields.some((field) =>
      String(field).toLowerCase().includes(normalizedSearch)
    );

    const matchesCategory = normalizedCategory === "all"
      || item.category.toLowerCase() === normalizedCategory;

    return matchesSearch && matchesCategory;
  });
}

function populateCategorySelect(select, items) {
  if (!select) {
    return [];
  }

  const previousValue = select.value || "all";
  const categories = [...new Set(items.map((item) => item.category))].sort();

  select.innerHTML = "";

  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "All categories";
  select.appendChild(allOption);

  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    select.appendChild(option);
  });

  select.value = categories.includes(previousValue) ? previousValue : "all";
  return categories;
}

function renderCategoryShortcuts(container, categories, activeCategory, onSelect) {
  if (!container) {
    return;
  }

  container.innerHTML = "";

  const options = ["all", ...categories];
  options.forEach((category) => {
    const button = createButton(
      category === "all" ? "All" : category,
      "shortcut",
      "filter-chip"
    );
    button.classList.toggle("is-active", activeCategory === category);
    button.dataset.category = category;
    button.addEventListener("click", () => onSelect(category));
    container.appendChild(button);
  });
}

function createButton(label, action, variant = "button-secondary") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `button button-small ${variant}`;
  button.dataset.action = action;
  button.textContent = label;
  return button;
}

function createStatusPill(status) {
  const pill = document.createElement("span");
  const normalized = String(status).toLowerCase();
  pill.className = `pill pill-status-${normalized}`;
  pill.textContent = status;
  return pill;
}

function getNextStatus(type, currentStatus) {
  if (type === "jobs") {
    return currentStatus === "Open" ? "Closed" : "Open";
  }

  return currentStatus === "Available" ? "Paused" : "Available";
}

function createListingCard(item, type) {
  const article = document.createElement("article");
  article.className = "listing-card";
  article.dataset.id = item.id;
  article.dataset.type = type;

  const top = document.createElement("div");
  top.className = "listing-top";

  const badges = document.createElement("div");
  badges.className = "listing-badges";

  const typeBadge = document.createElement("span");
  typeBadge.className = "listing-type";
  typeBadge.textContent = type === "jobs" ? "Open job" : "Ready to hire";
  badges.append(typeBadge, createStatusPill(item.status));

  if (isSaved(type, item.id)) {
    const savedBadge = document.createElement("span");
    savedBadge.className = "pill pill-soft";
    savedBadge.textContent = "Saved";
    badges.appendChild(savedBadge);
  }

  if (canManageItem(item)) {
    const ownerBadge = document.createElement("span");
    ownerBadge.className = "pill pill-owner";
    ownerBadge.textContent = "Your post";
    badges.appendChild(ownerBadge);
  }

  const category = document.createElement("span");
  category.className = "listing-category";
  category.textContent = item.category;

  top.append(badges, category);

  const title = document.createElement("h3");
  title.textContent = item.title;

  const description = document.createElement("p");
  description.className = "listing-description";
  description.textContent = item.description;

  const bottom = document.createElement("div");
  bottom.className = "listing-bottom";

  const meta = document.createElement("div");
  meta.className = "listing-meta";

  const primaryMeta = document.createElement("span");
  primaryMeta.className = "meta-row";
  primaryMeta.textContent = type === "jobs"
    ? `Location: ${item.location}`
    : `Provider: ${item.provider}`;

  const secondaryMeta = document.createElement("span");
  secondaryMeta.className = "meta-row";
  secondaryMeta.textContent = `Posted ${formatDate(item.createdAt)}`;

  meta.append(primaryMeta, secondaryMeta);

  if (item.ownerName) {
    const ownerMeta = document.createElement("span");
    ownerMeta.className = "meta-row";
    ownerMeta.textContent = `Posted by ${item.ownerName}`;
    meta.appendChild(ownerMeta);
  }

  const actions = document.createElement("div");
  actions.className = "listing-actions";
  actions.append(
    createButton("Details", "view"),
    createButton(isSaved(type, item.id) ? "Saved" : "Save", "save"),
    createButton(type === "jobs" ? "Apply" : "Hire", type === "jobs" ? "apply" : "hire")
  );

  if (canManageItem(item)) {
    actions.append(
      createButton(type === "jobs" ? "Toggle Status" : "Toggle Status", "toggle-status", "button-ghost"),
      createButton("Edit", "edit"),
      createButton("Delete", "delete", "button-danger")
    );
  }

  bottom.append(meta, actions);
  article.append(top, title, description, bottom);

  return article;
}

function createHistoryItem(item) {
  const entry = document.createElement("article");
  entry.className = "history-item";

  const label = document.createElement("strong");
  label.textContent = item.label;

  const detail = document.createElement("span");
  detail.textContent = item.detail;

  const date = document.createElement("span");
  date.className = "muted";
  date.textContent = formatDate(item.createdAt);

  entry.append(label, detail, date);
  return entry;
}

function createRecordItem(item) {
  const entry = document.createElement("article");
  entry.className = "history-item";

  const label = document.createElement("strong");
  label.textContent = `${item.action} • ${item.listingType === "jobs" ? "Job" : "Service"}`;

  const detail = document.createElement("span");
  detail.textContent = `${item.listingTitle} by ${item.actorName}`;

  const date = document.createElement("span");
  date.className = "muted";
  date.textContent = `${formatDate(item.createdAt)} • ${item.status}`;

  entry.append(label, detail, date);
  return entry;
}

function createProfileCard(label, value) {
  const card = document.createElement("article");
  card.className = "profile-card";

  const strong = document.createElement("strong");
  strong.textContent = value;

  const span = document.createElement("span");
  span.textContent = label;

  card.append(strong, span);
  return card;
}

function rerenderAll() {
  updateStatCards();
  updateAuthUI();
  ui.listingRenderers.forEach((render) => render());
  renderDashboard();
}

function applyTheme(theme) {
  appState.theme = theme === "night" ? "night" : "warm";
  document.body.classList.toggle("theme-night", appState.theme === "night");
  writeStorage(STORAGE_KEYS.theme, appState.theme);
}

function initializeTheme() {
  applyTheme(readStorage(STORAGE_KEYS.theme, "warm"));
}

function ensureModal() {
  if (document.querySelector("[data-modal]")) {
    return document.querySelector("[data-modal]");
  }

  const modal = document.createElement("div");
  modal.className = "modal is-hidden";
  modal.dataset.modal = "true";
  modal.innerHTML = `
    <div class="modal-card" role="dialog" aria-modal="true" aria-label="Listing details">
      <div class="modal-head">
        <div data-modal-title></div>
        <button class="button button-ghost modal-close" type="button" data-close-modal>Close</button>
      </div>
      <div class="modal-copy" data-modal-body></div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.addEventListener("click", (event) => {
    if (event.target === modal || event.target.closest("[data-close-modal]")) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeModal();
    }
  });

  return modal;
}

function closeModal() {
  const modal = document.querySelector("[data-modal]");
  if (!modal) {
    return;
  }

  modal.classList.add("is-hidden");
  const body = modal.querySelector("[data-modal-body]");
  const title = modal.querySelector("[data-modal-title]");

  if (body) {
    body.innerHTML = "";
  }

  if (title) {
    title.innerHTML = "";
  }
}

function openModal(item, type, mode = "view") {
  recordRecentView(type, item);

  const modal = ensureModal();
  const titleSlot = modal.querySelector("[data-modal-title]");
  const body = modal.querySelector("[data-modal-body]");

  titleSlot.innerHTML = "";
  body.innerHTML = "";

  if (mode === "edit") {
    renderEditModal(item, type, titleSlot, body);
  } else if (mode === "request") {
    renderRequestModal(item, type, titleSlot, body);
  } else {
    renderDetailsModal(item, type, titleSlot, body);
  }

  modal.classList.remove("is-hidden");
}

function renderDetailsModal(item, type, titleSlot, body) {
  const eyebrow = document.createElement("p");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = type === "jobs" ? "Job details" : "Service details";

  const title = document.createElement("h2");
  title.textContent = item.title;
  titleSlot.append(eyebrow, title);

  const content = document.createElement("div");
  content.className = "modal-meta";

  const description = document.createElement("p");
  description.className = "section-copy";
  description.textContent = item.description;

  const category = document.createElement("span");
  category.className = "pill";
  category.textContent = item.category;

  const status = createStatusPill(item.status);

  const metaPrimary = document.createElement("p");
  metaPrimary.className = "section-copy";
  metaPrimary.textContent = type === "jobs"
    ? `Location: ${item.location}`
    : `Provider: ${item.provider}`;

  const metaSecondary = document.createElement("p");
  metaSecondary.className = "section-copy";
  metaSecondary.textContent = `Posted on ${formatDate(item.createdAt)}`;

  content.append(category, status, description, metaPrimary, metaSecondary);

  if (item.ownerName) {
    const owner = document.createElement("p");
    owner.className = "section-copy";
    owner.textContent = `Posted by ${item.ownerName}`;
    content.appendChild(owner);
  }

  const foot = document.createElement("div");
  foot.className = "modal-foot";

  const left = document.createElement("div");
  left.className = "listing-actions";
  left.append(
    createButton(isSaved(type, item.id) ? "Saved" : "Save", "modal-save"),
    createButton(type === "jobs" ? "Apply" : "Hire", type === "jobs" ? "modal-apply" : "modal-hire")
  );

  const right = document.createElement("div");
  right.className = "listing-actions";

  if (canManageItem(item)) {
    right.append(
      createButton("Toggle Status", "modal-toggle-status", "button-ghost"),
      createButton("Edit", "modal-edit"),
      createButton("Delete", "modal-delete", "button-danger")
    );
  }

  foot.append(left, right);
  body.append(content, foot);

  foot.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-action]");
    if (!trigger) {
      return;
    }

    if (trigger.dataset.action === "modal-save") {
      toggleSaved(type, item);
      rerenderAll();
      openModal(findItem(type, item.id), type, "view");
      return;
    }

    if (trigger.dataset.action === "modal-apply" || trigger.dataset.action === "modal-hire") {
      openModal(item, type, "request");
      return;
    }

    if (trigger.dataset.action === "modal-toggle-status") {
      const nextItem = {
        ...item,
        status: getNextStatus(type, item.status),
      };
      updateItem(type, nextItem);
      recordActivity("Updated status", `${nextItem.title} → ${nextItem.status}`);
      rerenderAll();
      openModal(findItem(type, item.id), type, "view");
      return;
    }

    if (trigger.dataset.action === "modal-edit") {
      openModal(item, type, "edit");
      return;
    }

    if (trigger.dataset.action === "modal-delete") {
      const confirmed = window.confirm(`Delete "${item.title}"?`);
      if (!confirmed) {
        return;
      }

      deleteItem(type, item.id);
      recordActivity("Deleted listing", item.title);
      rerenderAll();
      closeModal();
    }
  });
}

function renderRequestModal(item, type, titleSlot, body) {
  const auth = getAuth();
  const isJob = type === "jobs";

  const eyebrow = document.createElement("p");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = isJob ? "Apply with message" : "Hire request";

  const title = document.createElement("h2");
  title.textContent = item.title;
  titleSlot.append(eyebrow, title);

  if (!auth) {
    const note = document.createElement("div");
    note.className = "empty-state";
    note.innerHTML = `
      <h3>Sign in first</h3>
      <p>You need a demo account before you can send requests or start a conversation.</p>
    `;
    body.appendChild(note);
    return;
  }

  const form = document.createElement("form");
  form.className = "form-card";

  const head = document.createElement("div");
  head.className = "form-card-head";
  head.innerHTML = `
    <p class="section-copy">${isJob ? "Send a short application message and start a conversation." : "Tell the provider what you need and start a conversation."}</p>
  `;

  const details = document.createElement("div");
  details.className = "request-summary";
  details.innerHTML = `
    <div class="request-summary-item">
      <span>Listing</span>
      <strong>${item.title}</strong>
    </div>
    <div class="request-summary-item">
      <span>${isJob ? "Contact" : "Provider"}</span>
      <strong>${getRequestTargetName(type, item)}</strong>
    </div>
  `;

  const nameField = document.createElement("label");
  nameField.className = "field";
  nameField.innerHTML = `
    <span>Your name</span>
    <input class="input" name="name" type="text" value="${auth.name}" required>
  `;

  const messageField = document.createElement("label");
  messageField.className = "field";
  messageField.innerHTML = `
    <span>${isJob ? "Application message" : "Hire request message"}</span>
    <textarea class="textarea" name="message" rows="5" placeholder="${isJob ? "Introduce yourself, mention availability, and why you fit." : "Describe what you need, timing, and any useful context."}" required></textarea>
  `;

  const metaGrid = document.createElement("div");
  metaGrid.className = "form-grid";

  const dateField = document.createElement("label");
  dateField.className = "field";
  dateField.innerHTML = `
    <span>Preferred date</span>
    <input class="input" name="preferredDate" type="text" placeholder="May 2, 2026">
  `;

  const budgetField = document.createElement("label");
  budgetField.className = "field";
  budgetField.innerHTML = `
    <span>${isJob ? "Expected pay" : "Budget"}</span>
    <input class="input" name="budget" type="text" placeholder="${isJob ? "$20/hour" : "$50 - $80"}">
  `;

  metaGrid.append(dateField, budgetField);

  const notice = document.createElement("div");
  notice.className = "notice is-hidden";

  const actions = document.createElement("div");
  actions.className = "modal-foot";
  const submitButton = createButton(isJob ? "Send application" : "Send hire request", "submit-request", "button-primary");
  submitButton.type = "submit";
  actions.append(
    submitButton,
    createButton("Back", "back-to-details", "button-ghost")
  );

  form.append(head, details, nameField, messageField, metaGrid, actions, notice);
  body.appendChild(form);

  form.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-action='back-to-details']");
    if (trigger) {
      openModal(item, type, "view");
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const name = String(formData.get("name")).trim();
    const message = String(formData.get("message")).trim();
    const preferredDate = String(formData.get("preferredDate")).trim();
    const budget = String(formData.get("budget")).trim();

    if (!name || !message) {
      showNotice(notice, "Please fill in your name and message.", "error");
      return;
    }

    setAuth({
      ...auth,
      name,
    });

    const conversation = createConversation(type, item, {
      kind: isJob ? "application" : "hire",
      message,
      preferredDate,
      budget,
    });

    if (!conversation) {
      showNotice(notice, "Could not start the conversation.", "error");
      return;
    }

    recordActivity(isJob ? "Applied to job" : "Sent hire request", item.title);
    recordInteraction(type, item, isJob ? "Applied" : "Hired");
    rerenderAll();
    window.location.href = `conversations.html?conversation=${conversation.id}`;
  });
}

function renderEditModal(item, type, titleSlot, body) {
  const eyebrow = document.createElement("p");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = "Edit your listing";

  const title = document.createElement("h2");
  title.textContent = item.title;
  titleSlot.append(eyebrow, title);

  const form = document.createElement("form");
  form.className = "form-card";

  const fields = type === "jobs"
    ? [
        ["title", "Job title", item.title],
        ["category", "Category", item.category],
        ["description", "Description", item.description, "textarea"],
        ["location", "Location", item.location],
      ]
    : [
        ["title", "Service title", item.title],
        ["category", "Category", item.category],
        ["description", "Description", item.description, "textarea"],
        ["provider", "Provider", item.provider],
      ];

  fields.forEach(([name, labelText, value, inputType]) => {
    const label = document.createElement("label");
    label.className = "field";

    const span = document.createElement("span");
    span.textContent = labelText;

    let input;
    if (inputType === "textarea") {
      input = document.createElement("textarea");
      input.className = "textarea";
      input.rows = 5;
      input.value = value;
    } else {
      input = document.createElement("input");
      input.className = "input";
      input.type = "text";
      input.value = value;
    }

    input.name = name;
    input.required = true;
    label.append(span, input);
    form.appendChild(label);
  });

  const statusLabel = document.createElement("label");
  statusLabel.className = "field";
  const statusText = document.createElement("span");
  statusText.textContent = "Status";
  const statusSelect = document.createElement("select");
  statusSelect.className = "select";
  statusSelect.name = "status";
  const statusOptions = type === "jobs" ? ["Open", "Closed"] : ["Available", "Paused"];
  statusOptions.forEach((status) => {
    const option = document.createElement("option");
    option.value = status;
    option.textContent = status;
    option.selected = item.status === status;
    statusSelect.appendChild(option);
  });
  statusLabel.append(statusText, statusSelect);
  form.appendChild(statusLabel);

  const actions = document.createElement("div");
  actions.className = "modal-foot";

  const saveButton = createButton("Save changes", "save-edit", "button-primary");
  saveButton.type = "submit";

  actions.append(
    saveButton,
    createButton("Cancel", "cancel-edit", "button-ghost")
  );

  form.appendChild(actions);
  body.appendChild(form);

  form.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-action='cancel-edit']");
    if (trigger) {
      openModal(item, type, "view");
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const nextItem = {
      ...item,
      title: String(formData.get("title")).trim(),
      category: String(formData.get("category")).trim(),
      description: String(formData.get("description")).trim(),
      location: type === "jobs" ? String(formData.get("location")).trim() : item.location,
      provider: type === "services" ? String(formData.get("provider")).trim() : item.provider,
      status: String(formData.get("status")).trim(),
    };

    if (!nextItem.title || !nextItem.category || !nextItem.description) {
      return;
    }

    updateItem(type, nextItem);
    recordActivity("Edited listing", nextItem.title);
    rerenderAll();
    openModal(findItem(type, item.id), type, "view");
  });
}

function updateAuthUI() {
  const auth = getAuth();
  const conversationCount = auth
    ? getConversations().filter((item) =>
        item.participants.some((participant) => participant.email === auth.email)
      ).length
    : 0;

  document.querySelectorAll("[data-nav-account]").forEach((container) => {
    container.innerHTML = "";

    const themeButton = createButton(
      appState.theme === "night" ? "Warm Theme" : "Night Theme",
      "toggle-theme",
      "button-ghost"
    );
    container.appendChild(themeButton);

    const modeChip = document.createElement("span");
    modeChip.className = "auth-chip";
    modeChip.textContent = appState.mode;
    container.appendChild(modeChip);

    const inboxLink = document.createElement("a");
    inboxLink.className = "auth-chip auth-chip-link";
    inboxLink.href = "conversations.html";
    inboxLink.innerHTML = `<span class="auth-chip-dot"></span><span>${conversationCount} chats</span>`;
    container.appendChild(inboxLink);

    if (auth) {
      const chip = document.createElement("span");
      chip.className = "auth-chip";
      chip.textContent = `Signed in as ${auth.name}`;

      const button = createButton("Sign Out", "logout", "button-ghost");
      container.append(chip, button);
      return;
    }

    const link = document.createElement("a");
    link.className = "button button-secondary button-small";
    link.href = "login.html";
    link.textContent = "Demo Login";
    container.appendChild(link);
  });

  document.querySelectorAll("[data-auth-status]").forEach((node) => {
    node.textContent = auth
      ? `Signed in as ${auth.name}. ${appState.mode} is active, and your own listings can be edited, toggled, or deleted.`
      : `Sign in to save listings, post your own items, and manage them later. Current mode: ${appState.mode}.`;
  });

  document.querySelectorAll("[data-auth-status-short]").forEach((node) => {
    node.textContent = auth ? auth.name : "Sign in";
  });

  document.querySelectorAll("[data-theme-label]").forEach((node) => {
    node.textContent = appState.theme === "night" ? "Night theme" : "Warm theme";
  });
}

function setupListingPage() {
  const page = document.querySelector("[data-listing-page]");
  if (!page) {
    return;
  }

  const type = page.dataset.listingPage;
  const grid = document.querySelector("[data-listing-grid]");
  const searchInput = document.querySelector("[data-search-input]");
  const categorySelect = document.querySelector("[data-category-select]");
  const shortcutContainer = document.querySelector("[data-category-shortcuts]");
  const countNode = document.querySelector("[data-result-count]");
  const notice = document.querySelector("[data-notice]");
  const emptyState = document.querySelector("[data-empty-state]");

  function render() {
    const sourceItems = sortByNewest(getCollection(type));
    const categories = populateCategorySelect(categorySelect, sourceItems);

    renderCategoryShortcuts(
      shortcutContainer,
      categories,
      categorySelect?.value || "all",
      (selectedCategory) => {
        categorySelect.value = selectedCategory;
        render();
      }
    );

    const filteredItems = getFilteredItems(
      sourceItems,
      searchInput?.value || "",
      categorySelect?.value || "all",
      type
    );

    if (countNode) {
      countNode.textContent = filteredItems.length;
    }

    if (!grid) {
      return;
    }

    grid.innerHTML = "";

    if (!filteredItems.length) {
      emptyState.hidden = false;
      return;
    }

    emptyState.hidden = true;
    filteredItems.forEach((item) => grid.appendChild(createListingCard(item, type)));
  }

  ui.listingRenderers.push(render);
  searchInput?.addEventListener("input", render);
  categorySelect?.addEventListener("change", render);

  grid?.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-action]");
    const parentCard = event.target.closest(".listing-card");
    const listingId = parentCard?.dataset.id;

    if (!trigger || !listingId) {
      return;
    }

    const item = findItem(type, listingId);
    if (!item) {
      return;
    }

    if (trigger.dataset.action === "view") {
      openModal(item, type, "view");
      rerenderAll();
      return;
    }

    if (trigger.dataset.action === "save") {
      const saved = toggleSaved(type, item);
      showNotice(notice, saved ? "Listing saved." : "Listing removed from saved items.");
      rerenderAll();
      return;
    }

    if (trigger.dataset.action === "apply" || trigger.dataset.action === "hire") {
      openModal(item, type, "request");
      return;
    }

    if (trigger.dataset.action === "toggle-status") {
      const nextItem = {
        ...item,
        status: getNextStatus(type, item.status),
      };
      updateItem(type, nextItem);
      recordActivity("Updated status", `${nextItem.title} → ${nextItem.status}`);
      showNotice(notice, `Status updated to ${nextItem.status}.`);
      rerenderAll();
      return;
    }

    if (trigger.dataset.action === "edit") {
      openModal(item, type, "edit");
      return;
    }

    if (trigger.dataset.action === "delete") {
      const confirmed = window.confirm(`Delete "${item.title}"?`);
      if (!confirmed) {
        return;
      }

      deleteItem(type, item.id);
      recordActivity("Deleted listing", item.title);
      showNotice(notice, "Listing deleted.");
      rerenderAll();
    }
  });

  render();
}

function renderDashboard() {
  const page = document.querySelector("[data-dashboard]");
  if (!page) {
    return;
  }

  const auth = getAuth();
  const jobGrid = document.querySelector("[data-dashboard-jobs]");
  const serviceGrid = document.querySelector("[data-dashboard-services]");
  const savedGrid = document.querySelector("[data-saved-grid]");
  const savedEmpty = document.querySelector("[data-saved-empty]");
  const activityList = document.querySelector("[data-activity-list]");
  const activityEmpty = document.querySelector("[data-activity-empty]");
  const myListingsGrid = document.querySelector("[data-my-listings-grid]");
  const myListingsEmpty = document.querySelector("[data-my-listings-empty]");
  const recordsList = document.querySelector("[data-records-list]");
  const recordsEmpty = document.querySelector("[data-records-empty]");
  const recentList = document.querySelector("[data-recent-list]");
  const recentEmpty = document.querySelector("[data-recent-empty]");
  const profileGrid = document.querySelector("[data-profile-grid]");

  if (jobGrid) {
    jobGrid.innerHTML = "";
    sortByNewest(getJobs()).slice(0, 3).forEach((item) => {
      jobGrid.appendChild(createListingCard(item, "jobs"));
    });
  }

  if (serviceGrid) {
    serviceGrid.innerHTML = "";
    sortByNewest(getServices()).slice(0, 3).forEach((item) => {
      serviceGrid.appendChild(createListingCard(item, "services"));
    });
  }

  if (savedGrid) {
    const savedItems = getSaved()
      .map((entry) => ({ entry, item: findItem(entry.type, entry.id) }))
      .filter((entry) => entry.item);

    savedGrid.innerHTML = "";

    if (!savedItems.length) {
      savedEmpty.hidden = false;
    } else {
      savedEmpty.hidden = true;
      savedItems.slice(0, 4).forEach(({ entry, item }) => {
        savedGrid.appendChild(createListingCard(item, entry.type));
      });
    }
  }

  if (activityList) {
    const activity = getActivity();
    activityList.innerHTML = "";

    if (!activity.length) {
      activityEmpty.hidden = false;
    } else {
      activityEmpty.hidden = true;
      activity.slice(0, 6).forEach((item) => activityList.appendChild(createHistoryItem(item)));
    }
  }

  if (myListingsGrid) {
    const myListings = auth
      ? sortByNewest([
          ...getJobs().filter((item) => item.ownerEmail === auth.email).map((item) => ({ item, type: "jobs", createdAt: item.createdAt })),
          ...getServices().filter((item) => item.ownerEmail === auth.email).map((item) => ({ item, type: "services", createdAt: item.createdAt })),
        ])
      : [];

    myListingsGrid.innerHTML = "";

    if (!myListings.length) {
      myListingsEmpty.hidden = false;
    } else {
      myListingsEmpty.hidden = true;
      myListings.forEach(({ item, type }) => {
        myListingsGrid.appendChild(createListingCard(item, type));
      });
    }
  }

  if (recordsList) {
    const records = getRecords();
    recordsList.innerHTML = "";

    if (!records.length) {
      recordsEmpty.hidden = false;
    } else {
      recordsEmpty.hidden = true;
      records.slice(0, 6).forEach((item) => recordsList.appendChild(createRecordItem(item)));
    }
  }

  if (recentList) {
    const recentItems = getRecent()
      .map((entry) => ({ ...entry, item: findItem(entry.type, entry.id) }))
      .filter((entry) => entry.item);

    recentList.innerHTML = "";

    if (!recentItems.length) {
      recentEmpty.hidden = false;
    } else {
      recentEmpty.hidden = true;
      recentItems.forEach((entry) => recentList.appendChild(createHistoryItem({
        label: `${entry.type === "jobs" ? "Job" : "Service"} viewed`,
        detail: entry.title,
        createdAt: entry.createdAt,
      })));
    }
  }

  if (profileGrid) {
    const stats = getProfileStats();
    profileGrid.innerHTML = "";
    profileGrid.append(
      createProfileCard("Signed-in user", auth?.name || "Guest"),
      createProfileCard("Email", auth?.email || "Not signed in"),
      createProfileCard("My posts", String(stats.posts)),
      createProfileCard("Saved items", String(stats.saved)),
      createProfileCard("My jobs", String(stats.jobs)),
      createProfileCard("My services", String(stats.services)),
      createProfileCard("Conversations", String(stats.conversations)),
      createProfileCard("Records", String(stats.records)),
      createProfileCard("Theme", appState.theme === "night" ? "Night" : "Warm")
    );
  }
}

function resetDemoData() {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  ensureData();
  initializeTheme();
  window.location.reload();
}

function saveDraft(form, draftKey) {
  const formData = new FormData(form);
  const draft = {};
  for (const [key, value] of formData.entries()) {
    draft[key] = value;
  }
  writeStorage(draftKey, draft);
}

function restoreDraft(form, draftKey, notice) {
  const draft = readStorage(draftKey, null);
  if (!draft) {
    return;
  }

  Object.entries(draft).forEach(([key, value]) => {
    const field = form.elements.namedItem(key);
    if (!field) {
      return;
    }
    field.value = value;
  });

  showNotice(notice, "Draft restored automatically.");
}

function clearDraft(draftKey, notice) {
  localStorage.removeItem(draftKey);
  showNotice(notice, "Draft cleared.");
}

function setupDashboardActions() {
  const page = document.querySelector("[data-dashboard]");
  if (!page) {
    return;
  }

  page.addEventListener("click", (event) => {
    const resetTrigger = event.target.closest("[data-action='reset-demo']");
    if (resetTrigger) {
      const confirmed = window.confirm("Clear all demo data and restore the starter listings?");
      if (!confirmed) {
        return;
      }

      resetDemoData();
      return;
    }

    const trigger = event.target.closest("[data-action]");
    const card = event.target.closest(".listing-card");
    if (!trigger || !card) {
      return;
    }

    const type = card.dataset.type;
    const item = findItem(type, card.dataset.id);
    if (!item) {
      return;
    }

    if (trigger.dataset.action === "view") {
      openModal(item, type, "view");
      rerenderAll();
      return;
    }

    if (trigger.dataset.action === "save") {
      toggleSaved(type, item);
      rerenderAll();
      return;
    }

    if (trigger.dataset.action === "apply" || trigger.dataset.action === "hire") {
      openModal(item, type, "request");
      return;
    }

    if (trigger.dataset.action === "toggle-status") {
      const nextItem = {
        ...item,
        status: getNextStatus(type, item.status),
      };
      updateItem(type, nextItem);
      recordActivity("Updated status", `${nextItem.title} → ${nextItem.status}`);
      rerenderAll();
      return;
    }

    if (trigger.dataset.action === "edit") {
      openModal(item, type, "edit");
      return;
    }

    if (trigger.dataset.action === "delete") {
      const confirmed = window.confirm(`Delete "${item.title}"?`);
      if (!confirmed) {
        return;
      }

      deleteItem(type, item.id);
      recordActivity("Deleted listing", item.title);
      rerenderAll();
    }
  });
}

function setupFormPage() {
  const form = document.querySelector("[data-form-type]");
  if (!form) {
    return;
  }

  const type = form.dataset.formType;
  const notice = document.querySelector("[data-form-notice]");
  const draftKey = type === "job" ? STORAGE_KEYS.draftJob : STORAGE_KEYS.draftService;

  restoreDraft(form, draftKey, notice);

  form.addEventListener("input", () => {
    saveDraft(form, draftKey);
  });

  form.addEventListener("click", (event) => {
    const clearTrigger = event.target.closest("[data-action='clear-draft']");
    if (!clearTrigger) {
      return;
    }

    form.reset();
    clearDraft(draftKey, notice);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const auth = getAuth();
    if (!auth) {
      showNotice(notice, "Please sign in first so the listing can be linked to your demo account.", "error");
      return;
    }

    const formData = new FormData(form);

    if (type === "job") {
      const newJob = {
        id: createId("job"),
        title: String(formData.get("title")).trim(),
        description: String(formData.get("description")).trim(),
        category: String(formData.get("category")).trim(),
        location: String(formData.get("location")).trim(),
        status: String(formData.get("status")).trim(),
        createdAt: new Date().toISOString(),
        ownerName: auth.name,
        ownerEmail: auth.email,
        isUserCreated: true,
      };

      setCollection("jobs", [newJob, ...getJobs()]);
      localStorage.removeItem(draftKey);
      recordActivity("Posted new job", newJob.title);
      form.reset();
      showNotice(notice, `Job posted: ${newJob.title}`);
      rerenderAll();
      return;
    }

    const newService = {
      id: createId("service"),
      title: String(formData.get("title")).trim(),
      description: String(formData.get("description")).trim(),
      category: String(formData.get("category")).trim(),
      provider: String(formData.get("provider")).trim(),
      status: String(formData.get("status")).trim(),
      createdAt: new Date().toISOString(),
      ownerName: auth.name,
      ownerEmail: auth.email,
      isUserCreated: true,
    };

    setCollection("services", [newService, ...getServices()]);
    localStorage.removeItem(draftKey);
    recordActivity("Posted new service", newService.title);
    form.reset();
    showNotice(notice, `Service posted: ${newService.title}`);
    rerenderAll();
  });
}

function setupLoginPage() {
  const form = document.querySelector("[data-login-form]");
  if (!form) {
    return;
  }

  const notice = document.querySelector("[data-form-notice]");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);

    const user = {
      name: String(formData.get("name")).trim(),
      email: String(formData.get("email")).trim(),
      provider: "local",
    };

    setAuth(user);
    recordActivity("Signed in", user.email);
    showNotice(notice, `Welcome, ${user.name}. Redirecting to the dashboard...`);
    updateAuthUI();

    window.setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 900);
  });
}

function createConversationCard(conversation, isActive) {
  const auth = getAuth();
  const isRequester = Boolean(auth && auth.email === conversation.requesterEmail);
  const counterpart = isRequester ? conversation.recipientName : conversation.requesterName;
  const card = document.createElement("button");
  card.type = "button";
  card.className = `conversation-card${isActive ? " is-active" : ""}`;
  card.dataset.conversationId = conversation.id;

  const title = document.createElement("strong");
  title.textContent = conversation.listingTitle;

  const meta = document.createElement("span");
  meta.className = "muted";
  meta.textContent = `${getConversationLabel(conversation)} with ${counterpart || "Contact"}`;

  const status = document.createElement("span");
  status.className = "conversation-status";
  status.textContent = `${conversation.status} • ${formatDate(conversation.updatedAt)}`;

  card.append(title, meta, status);
  return card;
}

function createMessageBubble(message) {
  const auth = getAuth();
  const isCurrentUser = Boolean(auth && message.senderEmail && auth.email === message.senderEmail);
  const bubble = document.createElement("article");
  bubble.className = `message-bubble${isCurrentUser ? " is-user" : ""}`;

  const sender = document.createElement("strong");
  sender.textContent = message.sender;

  const text = document.createElement("p");
  text.textContent = message.text;

  const date = document.createElement("span");
  date.className = "muted";
  date.textContent = formatDate(message.createdAt);

  bubble.append(sender, text, date);
  return bubble;
}

function setupConversationsPage() {
  const page = document.querySelector("[data-conversations-page]");
  if (!page) {
    return;
  }

  const list = document.querySelector("[data-conversation-list]");
  const empty = document.querySelector("[data-conversation-empty]");
  const title = document.querySelector("[data-conversation-title]");
  const meta = document.querySelector("[data-conversation-meta]");
  const messages = document.querySelector("[data-conversation-messages]");
  const chatEmpty = document.querySelector("[data-chat-empty]");
  const form = document.querySelector("[data-chat-form]");
  const notice = document.querySelector("[data-chat-notice]");
  const auth = getAuth();
  const params = new URLSearchParams(window.location.search);
  let activeConversationId = params.get("conversation") || null;

  function getVisibleConversations() {
    const items = sortByNewest(getConversations());
    if (!auth) {
      return [];
    }
    return items.filter((item) =>
      item.participants.some((participant) => participant.email === auth.email)
    );
  }

  function renderConversationDetails(conversation) {
    if (!conversation) {
      title.textContent = "No conversation selected";
      meta.textContent = "Send an application or hire request to start chatting.";
      messages.innerHTML = "";
      chatEmpty.hidden = false;
      form.hidden = true;
      return;
    }

    const isRequester = auth?.email === conversation.requesterEmail;
    const counterpart = isRequester ? conversation.recipientName : conversation.requesterName;
    title.textContent = conversation.listingTitle;
    meta.textContent = `${getConversationLabel(conversation)} with ${counterpart || "Contact"} • ${conversation.status}`;
    messages.innerHTML = "";
    chatEmpty.hidden = true;
    form.hidden = false;

    const summary = document.createElement("div");
    summary.className = "request-summary";
    summary.innerHTML = `
      <div class="request-summary-item">
        <span>Type</span>
        <strong>${getConversationLabel(conversation)}</strong>
      </div>
      <div class="request-summary-item">
        <span>Contact</span>
        <strong>${counterpart || conversation.targetName}</strong>
      </div>
      <div class="request-summary-item">
        <span>Preferred date</span>
        <strong>${conversation.preferredDate || "Not provided"}</strong>
      </div>
      <div class="request-summary-item">
        <span>Budget</span>
        <strong>${conversation.budget || "Not provided"}</strong>
      </div>
    `;
    messages.appendChild(summary);

    conversation.messages.forEach((message) => {
      messages.appendChild(createMessageBubble(message));
    });
  }

  function render() {
    const conversations = getVisibleConversations();
    list.innerHTML = "";

    if (!conversations.length) {
      empty.hidden = false;
      activeConversationId = null;
      renderConversationDetails(null);
      return;
    }

    empty.hidden = true;

    if (!activeConversationId || !conversations.some((item) => item.id === activeConversationId)) {
      activeConversationId = conversations[0].id;
    }

    conversations.forEach((conversation) => {
      list.appendChild(createConversationCard(conversation, conversation.id === activeConversationId));
    });

    renderConversationDetails(findConversation(activeConversationId));
  }

  list.addEventListener("click", (event) => {
    const card = event.target.closest("[data-conversation-id]");
    if (!card) {
      return;
    }

    activeConversationId = card.dataset.conversationId;
    render();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!activeConversationId) {
      return;
    }

    const formData = new FormData(form);
    const text = String(formData.get("message")).trim();
    if (!text) {
      showNotice(notice, "Write a message before sending.", "error");
      return;
    }

    const updated = appendConversationMessage(activeConversationId, text);
    if (!updated) {
      showNotice(notice, "Could not send the message.", "error");
      return;
    }

    recordActivity("Sent chat message", updated.listingTitle);
    form.reset();
    render();
    showNotice(notice, "Message sent.");
  });

  render();
}

function setupGlobalActions() {
  document.addEventListener("click", (event) => {
    const themeTrigger = event.target.closest("[data-action='toggle-theme']");
    if (themeTrigger) {
      applyTheme(appState.theme === "night" ? "warm" : "night");
      rerenderAll();
      return;
    }

    const logoutTrigger = event.target.closest("[data-action='logout']");
    if (!logoutTrigger) {
      return;
    }

    const auth = getAuth();
    if (auth) {
      recordActivity("Signed out", auth.email);
    }

    clearAuth();
    rerenderAll();
    window.location.reload();
  });
}

function init() {
  ensureData();
  initializeTheme();
  ensureModal();
  updateStatCards();
  updateAuthUI();
  setupGlobalActions();
  setupListingPage();
  setupDashboardActions();
  renderDashboard();
  setupFormPage();
  setupLoginPage();
  setupConversationsPage();
}

init();
