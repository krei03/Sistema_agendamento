const registerForm = document.querySelector('#registerForm');
const registerMessage = document.querySelector('#registerMessage');

registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  registerMessage.textContent = '';

  try {
    const data = await API.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: document.querySelector('#name').value,
        username: document.querySelector('#username').value,
        email: document.querySelector('#email').value,
        phone: document.querySelector('#phone').value,
        shopName: document.querySelector('#shopName').value,
        address: document.querySelector('#address').value,
        password: document.querySelector('#password').value
      })
    });
    API.token = data.token;
    window.location.href = '/dashboard.html';
  } catch (error) {
    registerMessage.textContent = error.message;
  }
});
