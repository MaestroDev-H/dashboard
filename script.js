const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// High-resolution canvas scaling
function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

const trailLength = 100;
const path = [];

let head = { x: canvas.width / 2, y: 0 };

const controlPoints = [
    { dx: 0, dy: 1, steps: 80 },
    { dx: -0.7, dy: 1, steps: 60 },
    { dx: 0, dy: 1, steps: 100 }
];

const totalSteps = controlPoints.reduce((sum, seg) => sum + seg.steps, 0);
let burstStages = { '30': false, '60': false, '100': false };
const activeBlusts = [];

const mainTimeline = gsap.timeline();
const totalDuration = 4;
const segmentDurations = controlPoints.map(p => (p.steps / totalSteps) * totalDuration);

let currentX = head.x;
let currentY = head.y;

controlPoints.forEach((point, index) => {
    const duration = segmentDurations[index];
    const targetX = currentX + point.dx * point.steps;
    const targetY = currentY + point.dy * point.steps;

    mainTimeline.to(head, {
        x: targetX,
        y: targetY,
        duration: duration,
        ease: "none",
        onUpdate: () => {
            path.push({ x: head.x, y: head.y });
            if (path.length > trailLength) path.shift();

            const progress = mainTimeline.progress() * 100;
            if (progress >= 30 && !burstStages['30']) {
                burstStages['30'] = true;
                createBlust(head.x, head.y, 0.5);
            }
            if (progress >= 60 && !burstStages['60']) {
                burstStages['60'] = true;
                createBlust(head.x, head.y, 0.75);
            }

            draw();
            updateBlusts();
        }
    });

    currentX = targetX;
    currentY = targetY;
});

mainTimeline.call(() => {
    if (!burstStages['100']) {
        burstStages['100'] = true;
        triggerThreeBlusts(head.x, head.y);
    }
});

// ✅ Clean continuous beam with glow
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (path.length > 1) {
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
            ctx.lineTo(path[i].x, path[i].y);
        }
        ctx.strokeStyle = "white";
        ctx.lineWidth = 4;
        ctx.shadowColor = "white";
        ctx.shadowBlur = 20;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
}

function createBlust(x, y, scale = 1.0) {
    const blust = {
        x,
        y,
        scale,
        radius: 30 * scale,
        opacity: 0.2
    };

    activeBlusts.push(blust);

    gsap.to(blust, {
        radius: `+=${45 * scale}`,
        opacity: 0,
        duration: 1.5,
        ease: "power2.out",
        onComplete: () => {
            const index = activeBlusts.indexOf(blust);
            if (index > -1) activeBlusts.splice(index, 1);
        }
    });
}

function updateBlusts() {
    for (const b of activeBlusts) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${b.opacity})`;
        ctx.shadowBlur = 30 * b.scale;
        ctx.shadowColor = "white";
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

function triggerThreeBlusts(cx, cy) {
    path.length = 0;
    activeBlusts.length = 0;

    const offsetX = canvas.clientWidth * 0.25;
    const positions = [
        { x: cx - offsetX, y: cy },
        { x: cx, y: cy },
        { x: cx + offsetX, y: cy }
    ];

    for (const pos of positions) {
        const finalBlust = { radius: 10, opacity: 1 };

        gsap.to(finalBlust, {
            radius: 106,
            opacity: 0,
            duration: 2,
            ease: "power2.out",
            onUpdate: () => {
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, finalBlust.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${finalBlust.opacity})`;
                ctx.shadowBlur = 60;
                ctx.shadowColor = "white";
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        });
    }

    gsap.delayedCall(2.1, () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
}

mainTimeline.play();
