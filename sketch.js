const canvas = document.getElementById('pong');  // Получить ссылку на HTML тэг canvas
const context = canvas.getContext('2d');  // Доступ к контексту рисования на canvas

const fps = 50;

const user_paddle = {  // Ракетка игрока
    x: 0,
    y: canvas.height / 2 - 50,
    width: 10,
    height: 100,
    color: '#fff',
    score: 0
};
const ai_paddle = {  // Ракетка компьютера
    x: canvas.width - 10,
    y: canvas.height / 2 - 50,
    width: 10,
    height: 100,
    color: '#fff',
    score: 0
};
const net = {  // Игровая сетка
    x: canvas.width / 2 - 1,
    y: 0,
    width: 2,
    height: 10,
    color: '#fff'
};
const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 10,
    speed: 5,
    velocityX: 5,
    velocityY: 5,
    color: '#fff'
};

function drawRect(x, y, w, h, color) {
    context.fillStyle = color;
    context.fillRect(x, y, w, h);
}

function drawCircle(x, y, r, color) {
    context.fillStyle = color;
    context.beginPath();
    context.arc(x, y, r, 0, Math.PI * 2, false);
    context.closePath();
    context.fill();
}

function drawText(text, x, y, color, font='75px Impact') {
    context.fillStyle = color;
    context.font = font;
    context.textBaseline = 'bottom';
    context.fillText(text, x, y);
}

function drawNet() {
    for (let i = 0; i < canvas.height; i += 15) {
        drawRect(net.x, net.y + i, net.width, net.height, net.color)
    }
}

function render() {  // Нарисовать целый кадр
    drawRect(0, 0, canvas.width, canvas.height, '#000');
    drawNet();
    drawText(user_paddle.score, canvas.width / 4, canvas.height / 5, '#fff');
    drawText(ai_paddle.score, canvas.width / 4 * 3, canvas.height / 5, '#fff');

    drawRect(user_paddle.x, user_paddle.y, user_paddle.width, user_paddle.height, user_paddle.color);
    drawRect(ai_paddle.x, ai_paddle.y, ai_paddle.width, ai_paddle.height, ai_paddle.color);

    drawCircle(ball.x, ball.y, ball.radius, ball.color);
}

function collision(b, p) {
    p.top = p.y;
    p.bottom = p.y + p.height;
    p.left = p.x;
    p.right = p.x + p.width;

    b.top = b.y - b.radius;
    b.bottom = b.y + b.radius;
    b.left = b.x - b.radius;
    b.right = b.x + b.radius;

    return b.right > p.left && b.bottom > p.top && b.left < p.right && b.top < p.bottom;
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.speed = 5;
    ball.velocityX = -ball.velocityX;
}

canvas.addEventListener('mousemove', movePaddle);

function movePaddle(evt) {
    let rect = canvas.getBoundingClientRect();
    user_paddle.y = evt.clientY - rect.top - user_paddle.height / 2;
}

function ai() {
    let difficulty_level = 0.05;  // 0-1 (1 - непобедимый)
    ai_paddle.y += (ball.y -  (ai_paddle.y + ai_paddle.height / 2)) * difficulty_level;
}

function update() {
    ball.x += ball.velocityX;
    ball.y += ball.velocityY;
    let player = (ball.x < canvas.width / 2) ? user_paddle : ai_paddle;

    // Проверка на столкновение с боковыми гранями поля
    if (ball.y + ball.radius >= canvas.height || ball.y - ball.radius <= 0) {
        ball.velocityY = - ball.velocityY;
    }

    // Проверка на столкновение с ракетками
    if (collision(ball, player)) {
        let collidePoint = (ball.y - (player.y + player.height / 2));
        collidePoint /= (player.height / 2);
        let angleRad = (Math.PI / 4) * collidePoint;
        let direction = (ball.x < canvas.width / 2) ? 1 : -1;

        ball.velocityX = direction * ball.speed * Math.cos(angleRad);
        ball.velocityY = direction * ball.speed * Math.sin(angleRad);

        ball.speed += 0.2;
    }

    if (ball.x - ball.radius <= 0) {  // Проверка на столкновение с лицевыми гранями
        ai_paddle.score++;
        resetBall();
    } else if (ball.x - ball.radius >= canvas.width) {
        user_paddle.score++;
        resetBall();
    }
}

function game() {
    ai();
    update();
    render();
}

setInterval(game, 1000 / fps);