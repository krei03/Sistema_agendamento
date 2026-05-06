const API = {
  tokenKey: 'barber_token',

  get token() {
    return localStorage.getItem(this.tokenKey);
  },

  set token(value) {
    localStorage.setItem(this.tokenKey, value);
  },

  logout() {
    localStorage.removeItem(this.tokenKey);
    window.location.href = '/login.html';
  },

  async request(path, options = {}) {
    const response = await fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        ...(options.headers || {})
      }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || 'Erro na operacao.');
    }

    return data;
  }
};
