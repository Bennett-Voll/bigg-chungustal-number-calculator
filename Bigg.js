class Bigg {
    constructor(uint8Array) {
        // note numbers must be given trough reversed
        // makes calculating easier
        this.numbers = uint8Array;
    }

    add(bigg) {
        const bigg1 = this.removeLeadingZeros();
        const bigg2 = bigg.removeLeadingZeros();

        const instance1 = bigg1.numbers;
        const instance2 = bigg2.numbers;

        const instanceLength1 = instance1.length;
        const instanceLength2 = instance2.length;

        const longestLength = Math.max(instanceLength1, instanceLength2) + 1;

        const result = new Uint8Array(longestLength);

        let overflow = 0;

        for (let i = 0; i < longestLength; i += 1) {
            let sumAtPlace = (instance1[i] || 0) + (instance2[i] || 0) + overflow;

            overflow = 0;

            if (sumAtPlace % 10 !== sumAtPlace) {
                overflow = Math.floor(sumAtPlace / 10);
                sumAtPlace %= 10;
            }

            result[i] = sumAtPlace;
        }

        if (overflow) {
            result[result.length - 1] = overflow;
        }

        return new Bigg(result);
    }

    subtract(bigg) {
        const bigg1 = this.removeLeadingZeros();
        const bigg2 = bigg.removeLeadingZeros();

        const instance1 = bigg1.numbers;
        const instance2 = bigg2.numbers;

        const instanceLength1 = instance1.length;
        const instanceLength2 = instance2.length;

        const longestLength = Math.max(instanceLength1, instanceLength2);

        const result = new Uint8Array(longestLength);

        let underflow = 0;

        for (let i = 0; i < longestLength; i += 1) {
            let sumAtPlace = (instance1[i] || 0) - (instance2[i] || 0) - underflow;

            underflow = 0;

            if (sumAtPlace < 0) {
                underflow = 1;
                sumAtPlace += 10;
            }

            result[i] = sumAtPlace;
        }

        if (underflow) {
            // implies negative number, not supported
        }

        return new Bigg(result);
    }

    multiply(bigg) {
        const bigg1 = this.removeLeadingZeros();
        const bigg2 = bigg.removeLeadingZeros();

        return bigg1.karatsuba(bigg1, bigg2);
    }

    karatsuba(bigg1, bigg2) {
        if (bigg1.getLength() <= 1) {
            return bigg2.multiplyBySingleDigit(bigg1.numbers[0] || 0);
        }

        if (bigg2.getLength() <= 1) {
            return bigg1.multiplyBySingleDigit(bigg2.numbers[0] || 0);
        }

        const minLength = Math.min(bigg1.getLength(), bigg2.getLength());
        const middle = Math.floor(minLength / 2);

        const [low1, high1] = bigg1.splitAt(middle);
        const [low2, high2] = bigg2.splitAt(middle);

        const z0 = this.karatsuba(low1, low2);
        const z1 = this.karatsuba(low1.add(high1), low2.add(high2));
        const z2 = this.karatsuba(high1, high2);

        return (
            z2.clone().addTrailingZeros(middle * 2).add( // first term
                z1.subtract(z2).subtract(z0).addTrailingZeros(middle) // second term
            ).add(
                z0 // last term
            )
        );
    }

    splitAt(index) {
        this.removeLeadingZeros();

        const length = this.getLength();

        const newInstance1 = new Uint8Array(index);
        const newInstance2 = new Uint8Array(length - index);

        for (let i = 0; i < length; i += 1) {
            if (i < index) {
                newInstance1[i] = this.numbers[i];
            } else {
                newInstance2[i - index] = this.numbers[i];
            }
        }

        return [new Bigg(newInstance1), new Bigg(newInstance2)];
    }

    removeLeadingZeros() {
        const length = this.numbers.length;

        let newUint8Array = new Uint8Array();
        let atEndOfNumber = true;

        for (let i = length - 1; i >= 0; i -= 1) {
            const numberAt = this.numbers[i];

            if (!atEndOfNumber || numberAt !== 0) {
                if (atEndOfNumber) {
                    newUint8Array = new Uint8Array(i + 1);
                }

                atEndOfNumber = false;
                newUint8Array[i] = numberAt;
            }

            // first number isn't a zero, cancel for efficiency
            if (atEndOfNumber && numberAt !== 0 && i === 0) {
                return this;
            }
        }

        this.numbers = newUint8Array;

        return this;
    }

    addTrailingZeros(count) {
        this.removeLeadingZeros();

        const newLength = this.numbers.length + count;
        const newUint8Array = new Uint8Array(newLength);

        for (let i = 0; i < newLength; i += 1) {
            if (i < count) {
                newUint8Array[i] = 0;
            } else {
                newUint8Array[i] = this.numbers[i - count];
            }
        }

        this.numbers = newUint8Array;

        return this;
    }

    multiplyBySingleDigit(multiplier) {
        if (multiplier > 10 || multiplier < 0) {
            return;
        }

        const bigg = this.removeLeadingZeros();
        const instance = bigg.numbers;
        const instanceLength = instance.length;
        const result = new Uint8Array(instanceLength + 1);

        let overflow = 0;

        for (let i = 0; i < instanceLength + 1; i += 1) {
            let resultAtPlace = (instance[i] || 0) * multiplier + overflow;

            overflow = 0;

            if (resultAtPlace % 10 !== resultAtPlace) {
                overflow = Math.floor(resultAtPlace / 10);
                resultAtPlace %= 10;
            }

            result[i] = resultAtPlace;
        }

        if (overflow) {
            result[result.length - 1] = overflow;
        }

        return new Bigg(result);
    }

    clone() {
        const length = this.getLength();
        const newUint8Array = new Uint8Array(this.getLength());

        for (let i = 0; i < length; i += 1) {
            newUint8Array[i] = this.numbers[i];
        }

        return new Bigg(newUint8Array);
    }

    getLength() {
        this.removeLeadingZeros();

        return this.numbers.length;
    }

    formatToString() {
        this.removeLeadingZeros();

        return this.formatToNormalNumberArray().join('');
    }

    formatToNormalNumberArray() {
        this.removeLeadingZeros();

        const normalNumberArray = [];

        for (let i = 0; i < this.numbers.length; i += 1) {
            normalNumberArray.push(this.numbers[i]);
        }

        return normalNumberArray.reverse();
    }
}

Bigg.fromString = (string) => {
    const numbArr = string.split('').map(e => +e);

    return new Bigg(new Uint8Array(numbArr.reverse()));
};

Bigg.fromSize = (size) => {
    return new Bigg(new Uint8Array(size));
};