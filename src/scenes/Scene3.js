import * as THREE from 'three';

export class Scene3 {
    constructor(scene2Objects) {
        this.scene2 = scene2Objects; 
        this.isActive = false;
        this.ui = this.createUI();
        this.state = 0; 
        this.alexHeadPos = new THREE.Vector3();
    }

    createUI() {
        const container = document.getElementById('dialogue-container') || document.createElement('div');
        container.id = 'dialogue-container';
        if (!document.getElementById('dialogue-container')) document.body.appendChild(container);

        // Bersihkan isi lama jika ada (untuk safety reload)
        container.innerHTML = '';

        const question = document.createElement('div');
        question.id = 'dialogue-question';
        container.appendChild(question);

        const choiceL = document.createElement('div');
        choiceL.className = 'choice-label';
        choiceL.style.opacity = '0';
        container.appendChild(choiceL);

        const choiceR = document.createElement('div');
        choiceR.className = 'choice-label';
        choiceR.style.opacity = '0';
        container.appendChild(choiceR);

        return { container, question, choiceL, choiceR };
    }

    setup() { console.log("Scene 3 Setup"); }

    start() {
        console.log("🗣️ Action: Scene 3 Start");
        this.isActive = true;
        this.state = 1; 
        this.ui.container.style.display = 'block';

        // [PENTING] Sembunyikan Steve saat ini juga (karena mode FPV)
        this.scene2.hideSteve();

        this.alexHeadPos = this.scene2.getAlexHeadPosition();
        this.setQuestionData(1);
    }

    setQuestionData(qIndex) {
        this.state = qIndex;
        this.ui.choiceL.classList.remove('choice-selected');
        this.ui.choiceR.classList.remove('choice-selected');
        this.ui.choiceL.style.opacity = '0';
        this.ui.choiceR.style.opacity = '0';
        this.ui.question.style.opacity = '0';

        if (qIndex === 1) {
            this.qData = { q: "Pagi! udah siap kerja?", l: "Malas", r: "Siap dong!" };
        } else {
            this.qData = { q: "Kamu mau masak atau crafting?", l: "Masak", r: "Crafting" };
        }
        this.ui.question.innerText = this.qData.q;
    }

    update(delta, timer, camera) {
        if (!this.isActive) return;

        const t = timer;
        const { question, choiceL, choiceR } = this.ui;

        // Timeline Fade UI
        if (t < 1.0) question.style.opacity = '1';
        else if (t > 2.0 && t < 2.5) question.style.opacity = '0';

        if (t > 2.5) {
            choiceL.style.opacity = '1'; choiceL.innerText = this.qData.l;
            choiceR.style.opacity = '1'; choiceR.innerText = this.qData.r;
        }

        // Highlight
        if (t >= 5.5) {
            if (this.state === 1) choiceR.classList.add('choice-selected');
            if (this.state === 2) choiceL.classList.add('choice-selected');
        }

        this.updateLabelPositions(camera);
    }

    updateLabelPositions(camera) {
        // Atur posisi Teks melayang di sebelah kiri & kanan Alex
        // Alex ada di x: -21.47, z: 23.28
        // Kita geser X nya
        const leftPos = new THREE.Vector3(-23.5, 19.5, 23.28); 
        const rightPos = new THREE.Vector3(-19.5, 19.5, 23.28); 

        this.projectToScreen(leftPos, this.ui.choiceL, camera);
        this.projectToScreen(rightPos, this.ui.choiceR, camera);
    }

    projectToScreen(position, element, camera) {
        const vector = position.clone().project(camera);
        const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-(vector.y * 0.5) + 0.5) * window.innerHeight;

        if (vector.z > 1) {
            element.style.display = 'none';
        } else {
            element.style.display = 'block';
            // Pakai fixed position agar lebih stabil
            element.style.left = `${x}px`;
            element.style.top = `${y}px`;
            element.style.transform = 'translate(-50%, -50%)'; 
        }
    }

    end() {
        this.isActive = false;
        this.ui.container.style.display = 'none';
        
        // Munculkan kembali Steve untuk mode Free Roam
        if (this.scene2.steveStatic) {
            this.scene2.steveStatic.visible = true;
        }
    }
}