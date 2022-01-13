import * as posedetection from '@tensorflow-models/pose-detection';

export function drawPose(pose, ctx, model, scoreThreshold) {
    ctx.clearRect(0, 0, 600, 400);
    if (pose.keypoints != null) {
        drawKeypoints(pose.keypoints, ctx, model, scoreThreshold);
        drawSkeleton(pose.keypoints, ctx, model, scoreThreshold);
    }
}

/**
 * Draw the keypoints on the video.
 * @param keypoints A list of keypoints.
 */
function drawKeypoints(keypoints, ctx, model, scoreThreshold) {
    const keypointInd =
        posedetection.util.getKeypointIndexBySide(model);
    ctx.fillStyle = 'Black';
    ctx.strokeStyle = 'Black';
    ctx.lineWidth = 2;
    for (const i of keypointInd.middle) {
        drawKeypoint(keypoints[i], ctx, scoreThreshold);
    }

    ctx.fillStyle = 'Green';
    for (const i of keypointInd.left) {
        drawKeypoint(keypoints[i], ctx, scoreThreshold);
    }

    ctx.fillStyle = 'Orange';
    for (const i of keypointInd.right) {
        drawKeypoint(keypoints[i], ctx, scoreThreshold);
    }
}

function drawKeypoint(keypoint, ctx, _scoreThreshold) {
    ctx.strokeStyle = 'Black';
    ctx.fillStyle = 'Orange';
    // If score is null, just show the keypoint.
    const score = keypoint.score != null ? keypoint.score : 1;
    const scoreThreshold = _scoreThreshold || 0;

    if (score >= scoreThreshold) {
        const circle = new Path2D();
        circle.arc(keypoint.x / 5, keypoint.y / 5, 3, 0, 2 * Math.PI);
        ctx.fill(circle);
        ctx.stroke(circle);
    }
}

/**
 * Draw the skeleton of a body on the video.
 * @param keypoints A list of keypoints.
 */
function drawSkeleton(keypoints, ctx, model, _scoreThreshold) {
    ctx.fillStyle = 'Black';
    ctx.strokeStyle = 'Black';
    ctx.lineWidth = 2;
    const scoreThreshold = _scoreThreshold || 0;


    posedetection.util.getAdjacentPairs(model).forEach(([
        i, j
    ]) => {
        const kp1 = keypoints[i];
        const kp2 = keypoints[j];

        // If score is null, just show the keypoint.
        const score1 = kp1.score != null ? kp1.score : 1;
        const score2 = kp2.score != null ? kp2.score : 1;

        if (score1 >= scoreThreshold && score2 >= scoreThreshold) {
            ctx.beginPath();
            ctx.moveTo(kp1.x, kp1.y);
            ctx.lineTo(kp2.x, kp2.y);
            ctx.stroke();
        }
    });
}