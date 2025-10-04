    /*
      Component for animating a texture using an image sequence (sprite sheet).
    */
    AFRAME.registerComponent('sprite-sheet-texture', {
      schema: {
        // Selector for all images to be used in the sequence.
        srcs: { type: 'selectorAll' },
        // Selector for the canvas to be used as a texture.
        targetCanvas: { type: 'selector' },
        // Frames per second of the animation.
        fps: { type: 'number', default: 10 }
      },

      init: function () {
        this.ctx = this.data.targetCanvas.getContext('2d');
        this.frameIndex = 0;
        this.texture = null;

        // Wait for the 3D model to load completely.
        this.el.addEventListener('model-loaded', () => {
          // Create a texture from the canvas.
          this.texture = new THREE.CanvasTexture(this.data.targetCanvas);

          // Get the 3D object (mesh) from the model.
          const mesh = this.el.getObject3D('mesh');
          if (!mesh) return;

          // Traverse the model to apply the new texture.
          mesh.traverse(node => {
            if (node.isMesh) {
              // Replace the material's texture map with our canvas.
              node.material.map = this.texture;
            }
          });
        });
      },

      // The tick function is called on every render frame.
      tick: function (time, timeDelta) {
        if (!this.data.srcs.length || !this.texture) return;

        // Calculate the current frame based on time and FPS.
        const frame = Math.floor(time / (1000 / this.data.fps)) % this.data.srcs.length;

        // Only redraw if the frame has changed.
        if (this.frameIndex !== frame) {
          this.frameIndex = frame;
          const img = this.data.srcs[this.frameIndex];
          // Clear the canvas and draw the new image.
          this.ctx.clearRect(0, 0, this.data.targetCanvas.width, this.data.targetCanvas.height);
          this.ctx.drawImage(img, 0, 0);
          // Mark the texture to be updated in the render.
          this.texture.needsUpdate = true;
        }
      }
    });