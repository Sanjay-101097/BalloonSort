import { _decorator, Collider, Component, instantiate, Material, MeshCollider, MeshRenderer, Node, Prefab, setDisplayStats } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('balloonCreation')
export class balloonCreation extends Component {
    @property(Material)
    objectsMaterial: Material[] = [];

    objects: number[] = [];
    originalobjects: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

    @property(Prefab)
    balloonPrefab: Prefab = null;

    @property(Prefab)
    circularContainer: Prefab = null;

    NUM_CIRCULAR_CONTAINERS = 9;
    balloonMainArray: Array<Array<number>> = [];
    currentSubArray = [];
    public setIdexArrayData: Array<Array<number>> = [];
    public setIdData: Array<Array<number>> = [];
    public TouchEnable = false;

    protected onLoad(): void {
        this.placingCircularContainers();
        setDisplayStats(false);

    }

    placingCircularContainers() {
        for (let i = 0; i < this.NUM_CIRCULAR_CONTAINERS; i++) {
            const circularContainer = instantiate(this.circularContainer);
            circularContainer.parent = this.node;
            circularContainer.setPosition(0, i * 0.2, 0);
        }
        this.balloonGenerate(19, 0);
        this.balloonGenerate(14, 1);
        this.balloonGenerate(8, 2);
        this.balloonGenerate(1, 3);
    }

    randobj;
    balloonGenerate(rounds: number, circles: number) {
        this.randobj = Math.floor(Math.random() * 9);

        for (let k = 0; k < this.NUM_CIRCULAR_CONTAINERS; k++) {
            let setdata = []
            let objNames = [];
            let setIndexData = [];
            for (let j = 0; j < rounds; j++) {
                const selectedobjects = this.selectobjects();
                const parentNode = this.node.children[k].children[circles].children[j];
               
                setIndexData.push(j);
                const balloon = instantiate(this.balloonPrefab);
                if(j==0 && k!= 3 && k!= 5&& rounds >=19){
                    balloon.getComponent(MeshRenderer).materials[0] = this.objectsMaterial[this.randobj];
                    setdata.push(this.randobj);
                }else{
                    balloon.getComponent(MeshRenderer).materials[0] = this.objectsMaterial[selectedobjects];
                    setdata.push(selectedobjects);
                }
                
                objNames.push(this.objectsMaterial[selectedobjects].name);
                balloon.parent = parentNode;
            }
            if (setdata.length >= 19 && rounds === 19) {
                this.balloonMainArray.push(setdata);
                this.setIdexArrayData.push(setIndexData);
                this.setIdData.push(objNames);
            }

        }
        // console.error("balloonMainArray",this.balloonMainArray); 
    }

    selectobjects(): number {
        if (this.objects.length === 0) {
            this.objects = [...this.originalobjects];
        }
        const index = Math.floor(Math.random() * this.objects.length);
        const selectedobjects = this.objects[index];
        this.objects[index] = this.objects[this.objects.length - 1];
        this.objects.pop();
        return selectedobjects;
    }

    changeinArray(arr1, arr2, Index, angle) {
        // Rotate the first array
        const rotatedArray1 = this.rotateArray(arr1[Index], angle);
        arr1[Index] = rotatedArray1;

        // Rotate the second array
        const rotatedArray2 = this.rotateArray(arr2[Index], angle);
        arr2[Index] = rotatedArray2;

        const rotatedArray3 = this.rotateArray(this.setIdData[Index], angle);
        this.setIdData[Index] = rotatedArray3;
        if (this.findSameElementIndices(this.balloonMainArray) != undefined) {
            for (let k = 0; k < this.NUM_CIRCULAR_CONTAINERS; k++) {
                const selectedobjects = this.selectobjects();
                // this.node.children[k].children[0].children[this.findSameElementIndices(this.balloonMainArray)].children[0].getComponent(MeshCollider).enabled = true;
                this.TouchEnable = true;
            }
        }

        let matchingIndexes = this.getMatchingIndices(this.balloonMainArray);
        console.log("Final balloonMainArray:", this.balloonMainArray, arr2);

        return matchingIndexes;
        // Log the final results for debugging

        //  console.error("Final setIdexArrayData:", this.setIdexArrayData);
        console.log("Final setIdData:", this.setIdData);
    }

    getMatchingIndices(matrix: number[][]): number[] {
        const rowCount = matrix.length;
        if (rowCount === 0) return [];

        const colCount = matrix[0].length;
        const matchingIndices: number[] = [];

        for (let col = 0; col < colCount; col++) {
            const value = matrix[0][col];
            let allMatch = true;
            for (let row = 1; row < rowCount; row++) {
                if (matrix[row][col] !== value) {
                    allMatch = false;
                    break;
                }
            }
            if (allMatch) {
                matchingIndices.push(col);
                // for (let row = 0; row < rowCount; row++) {
                //     matrix[row][col] = -1;
                // }
            }
        }

        return matchingIndices;
    }

    rotateArray(arr, degrees: number) {
        if (!Number.isFinite(degrees)) {
            throw new Error("Degrees must be a finite number");
        }

        const k = Math.floor(degrees / 19);
        // Normalize rotation: since array length is 10, use k mod 10
        const len = arr.length;
        const effectiveRotation = ((k % len) + len) % len; // Ensures positive rotation value

        // If no rotation needed, return a copy of the array
        if (effectiveRotation === 0) {
            return [...arr];
        }
        const rotateIndex = len - effectiveRotation;
        return [...arr.slice(rotateIndex), ...arr.slice(0, rotateIndex)];
    }



    findSameElementIndices(nestedArray) {
        const sameIndices = [];

        // Check each position (0 to 18)
        for (let pos = 0; pos < 19; pos++) {
            const firstElement = nestedArray[0][pos];
            // Check if all sub-arrays have the same element at this position
            const allSame = nestedArray.every(subArray => subArray[pos] === firstElement);
            if (allSame) {
                sameIndices.push(pos);
                return pos
            }
        }

        return sameIndices[0];
    }

    // Main function to process array and find indices
    //  processNestedArray() {
    //         console.log("Nested Array:", this.balloonMainArray);

    //         const sameIndices = this.findSameElementIndices(this.balloonMainArray);
    //         if (sameIndices.length > 0) {
    //           console.log("Indices where all elements are the same:", sameIndices);
    //           // Log the value at each identified position
    //           sameIndices.forEach(pos => {
    //           });
    //         } else {
    //           console.log("No positions found where all elements are the same.");
    //         }

    //         return {sameIndices };
    //       }

    // Run the function



}


