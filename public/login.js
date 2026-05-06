const loginForm = document.querySelector('#loginForm');
const loginMessage = document.querySelector('#loginMessage');

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginMessage.textContent = '';

  try {
    const data = await API.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: document.querySelector('#username').value,
        password: document.querySelector('#password').value
      })
    });
    API.token = data.token;
    window.location.href = '/dashboard.html';
  } catch (error) {
    loginMessage.textContent = error.message;
  }
});
