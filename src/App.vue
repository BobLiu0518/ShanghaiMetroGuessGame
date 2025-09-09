<template>
    <el-container>
        <el-main>
            <h2 @click="resetGame()">猜铁上海</h2>
            <el-text v-if="cheatMode" class="wave-text" @click="setAnswer()">你已进入作弊模式！</el-text>
            <el-text v-else-if="succeeded" type="success">恭喜你，你猜对了！</el-text>
            <el-text v-else-if="tried >= 6 && !cheatMode" type="danger" @click="showAnswer()">很遗憾，机会用尽了。</el-text>
            <el-text v-else>你能猜到随机的地铁站吗？</el-text>
            <br />
            <el-text>换乘次数和站点距离独立计算。</el-text>
            <el-divider />
            <el-space direction="vertical">
                <el-text>
                    <b>猜测次数 {{ tried }}/{{ cheatMode ? '∞' : '6' }}</b>
                </el-text>
                <el-space>
                    <el-select class="guessInput" v-model="guessStation" placeholder="输入猜测车站" @change="guess()" filterable clearable>
                        <el-option v-for="station of stations" :key="station.id" :label="station.name" :value="station.name" />
                    </el-select>
                    <!-- <el-button type="primary" :disabled="!guessStation || tried >= 6" @click="guess()">猜测</el-button> -->
                </el-space>
                <el-card v-for="guess in guesses" shadow="never">
                    <el-descriptions :title="guess.stationInfo.name" direction="vertical" border>
                        <el-descriptions-item label="区">
                            <el-text :type="guess.district ? 'success' : ''">{{ guess.stationInfo.district }}</el-text>
                        </el-descriptions-item>
                        <el-descriptions-item label="线路" :span="2">
                            <el-text :type="guess.line == 'every' ? 'success' : guess.line == 'some' ? 'warning' : ''">{{
                                guess.stationInfo.line.join(' ')
                            }}</el-text>
                        </el-descriptions-item>
                        <el-descriptions-item label="目标换乘">
                            <el-text :type="guess.minTransfer == 0 ? 'success' : ''">{{ guess.minTransfer }}</el-text>
                        </el-descriptions-item>
                        <el-descriptions-item label="目标距离">
                            <el-text :type="guess.minStations == 0 ? 'success' : ''">{{ guess.minStations }}</el-text>
                        </el-descriptions-item>
                        <el-descriptions-item label="投用时间">
                            <el-text :type="guess.year == 0 ? 'success' : ''">
                                {{ guess.stationInfo.year }}{{ { '1': '↑', '0': '', '-1': '↓' }[guess.year] }}
                            </el-text>
                        </el-descriptions-item>
                        <el-descriptions-item v-if="cheatMode" label="剩余可能车站" :span="3">
                            {{ guess.remain.map((station) => station.name).join(' ') }}
                        </el-descriptions-item>
                    </el-descriptions>
                </el-card>
            </el-space>
        </el-main>
        <el-footer>
            <el-text>已有</el-text> <el-text type="success" title="好臭啊" @click="toggleCheatMode()">114514</el-text> <el-text>人没猜出</el-text><br />
            <el-link href="https://xiaoce.fun/metro/shanghai" target="_blank" underline="hover">抄袭自猜盐</el-link>
        </el-footer>
    </el-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import StationGuessGame, { type GuessResult } from './guess.ts';
import stations from './stations.json' with { type: 'json' };

let guessStation = ref('');
const guesses = ref<GuessResult[]>([]);
let tried = ref(0);
let succeeded = ref(false);
let cheatMode = ref(false);

const game = new StationGuessGame();

const guess = (): void => {
    if (!guessStation.value) {
        return;
    }
    if (tried.value >= 6 && !cheatMode.value) {
        ElMessage.error('机会已经用尽啦');
        return;
    }
    if (succeeded.value && !cheatMode.value) {
        ElMessage.info('你已经猜对，无需再猜啦');
        return;
    }
    if (guesses.value.map((guess) => guess.stationInfo.name).includes(guessStation.value)) {
        ElMessage.error('你已经猜过这个站啦');
        return;
    }
    tried.value++;
    const result = game.getGuessResult(guessStation.value);
    guessStation.value = '';
    guesses.value.unshift(result);
    if (result.correct) {
        succeeded.value = true;
    }
};

const toggleCheatMode = async (): Promise<void> => {
    if (!cheatMode.value) {
        try {
            await ElMessageBox.confirm('要进入作弊模式吗？', '作弊模式', {
                confirmButtonText: '确认',
                cancelButtonText: '取消',
                type: 'info',
            });
        } catch (e) {
            return;
        }
    }
    // cheatMode.value = !cheatMode.value;
    cheatMode.value = true; // 一去不复返
    ElMessage.info(`您已${cheatMode.value ? '进入' : '退出'}作弊模式`);
};

const showAnswer = (): void => {
    ElMessage.info(`正确答案是：${game.getAnswer()}`);
};

const setAnswer = (): void => {
    const stationName = guesses.value[0]?.stationInfo.name;
    if (stationName) {
        resetGame();
        game.setAnswer(stationName);
        cheatMode.value = true;
        ElMessage.info(`已设置谜底为 ${stationName}`);
    }
};

const resetGame = (): void => {
    game.resetGame();
    tried.value = 0;
    guesses.value = [];
    succeeded.value = false;
    cheatMode.value = false;
    ElMessage.info('已重开游戏~');
};
</script>
<style scoped>
.guessInput {
    width: 280px;
}
.wave-text {
    background: linear-gradient(
        90deg,
        #ff0000,
        #ff3300,
        #ff6600,
        #ff9900,
        #ffff00,
        #99ff00,
        #33cc33,
        #00cc99,
        #0099ff,
        #0066ff,
        #6633cc,
        #cc33cc,
        #ff0066,
        #ff0000
    );
    background-size: 1400% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    animation: wave 8s linear infinite;
}

@keyframes wave {
    0% {
        background-position: 0% 50%;
    }
    100% {
        background-position: 100% 50%;
    }
}
</style>
