const canvas = document.getElementById('pong');  // Получить ссылку на HTML тэг canvas
const context = canvas.getContext('2d');  // Доступ к контексту рисования на canvas

const max_ghost_mode = 3;
const fps = 50;
let ghost_mode = 0;  // Прозрачность ракетки 3 кадра после удара, для избежания повторного удара

const user_paddle = {  // Ракетка игрока
    x: 0,
    y: canvas.height / 2 - 50,
    width: 15,
    height: 100,
    color: '#fff',
    score: 0,
};
const ai_paddle = {  // Ракетка компьютера
    x: canvas.width - 15,
    y: canvas.height / 2 - 50,
    width: 15,
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
    speed: 4,
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
    // Рендер поля
    drawRect(0, 0, canvas.width, canvas.height, '#000');
    drawNet();
    // Рендер счета
    drawText(user_paddle.score, canvas.width / 4, canvas.height / 5, '#fff');
    drawText(ai_paddle.score, canvas.width / 4 * 3, canvas.height / 5, '#fff');

    // Рендер ракеток
    drawRect(user_paddle.x, user_paddle.y, user_paddle.width, user_paddle.height, user_paddle.color);
    drawRect(ai_paddle.x, ai_paddle.y, ai_paddle.width, ai_paddle.height, ai_paddle.color);

    // Рендер мячика
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
    let score_diff = user_paddle.score - ai_paddle.score;
    score_diff = (score_diff >= 0) ? score_diff : 0;
    let score_sum = user_paddle.score + ai_paddle.score;
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.speed = 4 + (score_diff / 2.5) + (score_sum / 20);
    ball.velocityX = -ball.velocityX;
}

canvas.addEventListener('mousemove', movePaddle);

function movePaddle(evt) {
    let rect = canvas.getBoundingClientRect();
    user_paddle.y = evt.clientY - rect.top - user_paddle.height / 2;
}

function ai() {
    let score_diff = user_paddle.score - ai_paddle.score;
    score_diff = (score_diff >= 0) ? score_diff : 0;
    let difficulty_level = 0.05;  // 0-1 (1 - непобедимый)
    let difficulty_level_inc = Math.pow(2, score_diff/100) - 1;  // Динамическое повышение уровня сложности
    ai_paddle.y += (ball.y -  (ai_paddle.y + ai_paddle.height / 2)) * (difficulty_level + difficulty_level_inc);
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
    if (collision(ball, player) && ghost_mode === 0) {

        let collidePoint = (ball.y - (player.y + player.height / 2));
        /*
        * Краткое описание математической логики:
        * Если мячик ударяется о грань ракетки (то есть расстояние от чентра ракетки до точки касания <= 45,
        * что имеет смысл, так как расстояние может быть на интервале (-55, 55), где все, что больше 50 -
        * это касание только угла), то просто инвертируем скорость по X, так как такой удар не повлияет на угол
        * траектории мяча (скорость ракетки пока не учитывается).
        * Если мячик ударяется об угол ракетки (то есть collidePoint > 45), то вычисляется угол полёта мяча, по
        * тригонометрической формуле.
        */
        if ((Math.abs(collidePoint) > 45) && (ball.velocityY < 0 === collidePoint > 0)) {
            collidePoint /= (player.height / 2);
            let angleRad = (Math.PI / 4) * collidePoint;
            let direction = (ball.x < canvas.width / 2) ? 1 : -1;

            ball.velocityX = direction * ball.speed * Math.cos(angleRad);
            ball.velocityY = ball.speed * Math.sin(angleRad);
        } else {
            ball.velocityX *= -1;
        }

        ghost_mode = 3;
        ball.speed += 0.2;
    } else if (ghost_mode > 0) {
        ghost_mode -= 1;
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

render();

document.addEventListener('keydown', run);

let main_loop;  // Основной игровой цикл. Когда он запускается, игра начинает работать
let enter = 0;  // Кратность количество нажатий Enter (для возможность ставить игру на паузу. *костыль*)

function run(event) {
    // Функция отвечает за запуск и перезапуск и игры
    if (event.keyCode === 13) {
        enter = (enter + 1) % 2;  // enter = 1  =>  игра запускается. enter = 0  =>  игра перезапускается
        if (enter === 1) {
            main_loop = setInterval(game, 1000 / fps);
        } else {
            // Перезапуск игрового поля
            clearInterval(main_loop);
            resetBall();
            user_paddle.score = 0;
            user_paddle.y = canvas.height / 2 - 50;
            ai_paddle.score = 0;
            ai_paddle.y = canvas.height / 2 - 50;
            render();
        }
    }
}