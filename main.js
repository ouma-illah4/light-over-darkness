// --- Daily Scriptures ---
const scriptures = [
  "John 1:5 - The light shines in darkness, and the darkness has not overcome it.",
  "Psalm 34:18 - The LORD is close to the brokenhearted and saves those who are crushed in spirit.",
  "2 Corinthians 4:6 - For God, who said 'Let light shine out of darkness,' made his light shine in our hearts...",
  "Isaiah 41:10 - Fear not, for I am with you; be not dismayed, for I am your God...",
  "Romans 8:38-39 - Nothing in all creation can separate us from the love of God...",
  "2 Corinthians 12:9 - 'My grace is sufficient for you, for my power is made perfect in weakness.'"
];

function getDailyScripture() {
  const day = Math.floor((new Date() - new Date(new Date().getFullYear(),0,0)) / (1000*60*60*24));
  return scriptures[day % scriptures.length];
}

// --- Blog Loader ---
async function loadBlog(postsToShow = null) {
  try {
    const res = await fetch("posts.json");
    const posts = await res.json();
    const container = document.getElementById("blog-posts");
    if (!container) return;

    const displayPosts = postsToShow ? postsToShow(posts) : posts;
    displayPosts.forEach(post => {
      const article = document.createElement("article");
      article.className = postsToShow ? "blog-preview" : "blog-card";
      article.innerHTML = `
        <h3>${post.title}</h3>
        <time datetime="${post.date}">${new Date(post.date).toDateString()}</time>
        <p class="${postsToShow ? "" : "excerpt"}">${post.excerpt}</p>
        ${!postsToShow ? `<p class="full-text" hidden>${post.fullText}</p><button class="read-more">Read More</button>` : ""}
      `;
      container.appendChild(article);
    });

    if (!postsToShow) {
      document.querySelectorAll(".read-more").forEach(btn => btn.addEventListener("click", () => {
        const fullText = btn.closest(".blog-card").querySelector(".full-text");
        fullText.hidden = !fullText.hidden;
        btn.textContent = fullText.hidden ? "Read More" : "Read Less";
      }));
      revealBlogCards();
    } else {
      const moreLink = document.createElement("a");
      moreLink.href = "blog.html";
      moreLink.className = "read-more-link";
      moreLink.textContent = "Read more reflections →";
      container.appendChild(moreLink);
      revealSections();
    }

  } catch (err) {
    console.error("Blog load error:", err);
  }
}

function revealBlogCards() {
  document.querySelectorAll(".blog-card").forEach(card => {
    new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if(entry.isIntersecting){
          entry.target.classList.add("show");
          obs.unobserve(entry.target);
        }
      });
    }, {threshold:0.2}).observe(card);
  });
}

function revealSections() {
  const revealables = document.querySelectorAll("section, .card, article, .hero-text");
  if (revealables.length < 10 || document.body.scrollHeight <= window.innerHeight + 200) {
    revealables.forEach(el => el.classList.add("show"));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if(e.isIntersecting) e.target.classList.add("show"); });
  }, {threshold:0.15});
  revealables.forEach(el => observer.observe(el));
}

// --- Mobile Menu ---
function setupMenu() {
  const toggle = document.getElementById("menu-toggle");
  const nav = document.getElementById("nav-links");
  if(toggle && nav){
    toggle.addEventListener("click", () => {
      nav.classList.toggle("open");
      toggle.classList.toggle("active"); // optional visual cue
    });
  }
}

// --- Active Link Highlight ---
function highlightNav() {
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-link");
  window.addEventListener("scroll", () => {
    const scrollY = window.pageYOffset;
    sections.forEach(s => {
      if(scrollY > s.offsetTop - 120 && scrollY <= s.offsetTop + s.offsetHeight){
        navLinks.forEach(l => l.classList.remove("active"));
        const active = Array.from(navLinks).find(l => l.href.includes(s.id));
        if(active) active.classList.add("active");
      }
    });
  });
}

// --- Transition animations ---
function setupTransitions() {
  document.querySelectorAll(".transition").forEach(el => {
    new IntersectionObserver((entries, obs) => {
      entries.forEach(e => {
        if(e.isIntersecting){
          e.target.classList.add("show");
          obs.unobserve(e.target);
        }
      });
    }, {threshold:0.2}).observe(el);
  });
}

// --- PWA Service Worker ---
if("serviceWorker" in navigator){
  navigator.serviceWorker.register("/service-worker.js")
    .then(reg => console.log("SW registered:", reg.scope))
    .catch(err => console.log("SW failed:", err));
}

let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const btn = document.getElementById('installBtn');
  if(btn) btn.style.display='block';
  btn.addEventListener('click', () => {
    btn.style.display='none';
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(choice => {
      console.log('User choice:', choice.outcome);
      deferredPrompt = null;
    });
  });
});

// --- Init ---
document.addEventListener("DOMContentLoaded", () => {
  // Daily Scripture
  const scriptureBox = document.getElementById("scripture-text");
  if(scriptureBox) scriptureBox.textContent = getDailyScripture();

  // Blog content
  const path = window.location.pathname;
  if(path.includes("blog.html")) loadBlog();
  else if(path.includes("index.html") || path === "/" || path === "") 
    loadBlog(posts => posts.sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,2));
  else revealSections();

  // Menu & navigation
  setupMenu();
  highlightNav();
  setupTransitions();
});







