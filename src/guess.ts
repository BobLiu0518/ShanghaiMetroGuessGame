import stations from './stations.json' with { type: 'json' };

type Station = {
    id: number;
    name: string;
    nearStation: number[];
    district: string;
    year: number;
    line: string[];
};

type GuessAttributeDifference = {
    district: boolean;
    line: 'every' | 'some' | 'none';
    year: number;
};

export type GuessResult = GuessAttributeDifference & {
    stationInfo: Station;
    correct: boolean;
    minStations: number;
    minTransfer: number;
    remain: Station[];
};

class StationGuessGame {
    private stationsByName: Map<string, Station> = new Map();
    private stationsById: Map<number, Station> = new Map();
    private lineStations: Map<string, Station[]> = new Map();
    private remainStations: Station[] = stations;
    private targetStation: Station;

    constructor() {
        for (const station of stations) {
            this.stationsByName.set(station.name, station);
            this.stationsById.set(station.id, station);

            for (const line of station.line) {
                if (!this.lineStations.has(line)) {
                    this.lineStations.set(line, []);
                }
                this.lineStations.get(line)!.push(station);
            }
        }
        this.targetStation = this.getRandomStation();
    }

    private getStationByName(name: string): Station {
        return this.stationsByName.get(name)!;
    }

    private getStationById(id: number): Station {
        return this.stationsById.get(id)!;
    }

    private getLineStations(lineName: string): Station[] {
        return this.lineStations.get(lineName)!;
    }

    getRandomStation(): Station {
        return stations[Math.floor(Math.random() * stations.length)];
    }

    getMinStations(target: Station, guess: Station): number {
        let minStations = 0;
        let currentStations = [guess.id];
        let previousStations: number[];
        let visitedStations = new Set<number>();

        while (!currentStations.includes(target.id)) {
            minStations++;
            previousStations = currentStations;
            currentStations = [];
            for (const stationId of previousStations) {
                if (!visitedStations.has(stationId)) {
                    visitedStations.add(stationId);
                    const station = this.getStationById(stationId);
                    if (station) {
                        currentStations.push(...station.nearStation.filter((station) => !visitedStations.has(station)));
                    }
                }
            }
            if (!currentStations.length) {
                this.remainStations = [];
                return Infinity;
            }
        }
        this.remainStations = this.remainStations.filter((station) => currentStations.includes(station.id));

        return minStations;
    }

    getMinTransfer(target: Station, guess: Station): number {
        let minTransfer = 0;
        let currentLines = guess.line;
        let previousLines: string[];
        let visitedLines = new Set<string>();
        let reachableStations: Station[] = [];
        let visitedStations = new Set<Station>();

        while (true) {
            reachableStations = currentLines.flatMap((line) => this.getLineStations(line));
            if (reachableStations.includes(target)) {
                break;
            }
            minTransfer++;
            currentLines.forEach((line) => visitedLines.add(line));
            previousLines = currentLines;
            currentLines = [];
            for (const line of previousLines) {
                for (const station of this.getLineStations(line)) {
                    visitedStations.add(station);
                    for (const transferLine of station.line) {
                        if (!visitedLines.has(transferLine)) {
                            currentLines.push(transferLine);
                        }
                    }
                }
            }
            if (!currentLines.length) {
                this.remainStations = [];
                return Infinity;
            }
        }
        this.remainStations = this.remainStations.filter((station) => !visitedStations.has(station) && reachableStations.includes(station));

        return minTransfer;
    }

    getAttributeDifference(target: Station, guess: Station): GuessAttributeDifference {
        const targetLines = new Set(target.line);
        const guessLines = new Set(guess.line);
        const intersection = new Set([...targetLines].filter((line) => guessLines.has(line)));

        return {
            district: guess.district == target.district,
            line: intersection.size === targetLines.size && intersection.size === guessLines.size ? 'every' : intersection.size > 0 ? 'some' : 'none',
            year: Math.sign(target.year - guess.year),
        };
    }

    getGuessResult(guessName: string): GuessResult {
        const target = this.targetStation;
        const guess = this.getStationByName(guessName);

        const minStations = this.getMinStations(target, guess);
        const minTransfer = this.getMinTransfer(target, guess);
        const attributeDifference = this.getAttributeDifference(target, guess);

        this.remainStations = this.remainStations.filter((station) => {
            const diff = this.getAttributeDifference(station, guess);
            return diff.district == attributeDifference.district && diff.line == attributeDifference.line && diff.year == attributeDifference.year;
        });

        return {
            correct: guess == target,
            stationInfo: guess,
            minStations,
            minTransfer,
            remain: this.remainStations,
            ...attributeDifference,
        };
    }

    getAnswer(): string {
        return this.targetStation.name;
    }

    setAnswer(stationName: string): void {
        this.targetStation = this.getStationByName(stationName);
    }

    resetGame(): void {
        this.remainStations = stations;
        this.targetStation = this.getRandomStation();
    }
}

export default StationGuessGame;
