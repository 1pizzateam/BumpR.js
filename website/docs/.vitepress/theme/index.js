import { h } from 'vue';
import DefaultTheme from 'vitepress/theme';
import BumpRLogo from './components/BumpRLogo.vue';
import BouncingDemo from './components/BouncingDemo.vue';
import RestitutionDemo from './components/RestitutionDemo.vue';
import GridBroadphaseDemo from './components/GridBroadphaseDemo.vue';
import CollisionShapesDemo from './components/CollisionShapesDemo.vue';
import PhysicsDemo from './components/PhysicsDemo.vue';
import './demo.css';

export default {
  extends: DefaultTheme,
  // The homepage mark is the library drawing itself, standing in for the hero image
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'home-hero-image': () => h(BumpRLogo),
    });
  },
  enhanceApp({ app }) {
    app.component('BumpRLogo', BumpRLogo);
    app.component('BouncingDemo', BouncingDemo);
    app.component('RestitutionDemo', RestitutionDemo);
    app.component('GridBroadphaseDemo', GridBroadphaseDemo);
    app.component('CollisionShapesDemo', CollisionShapesDemo);
    app.component('PhysicsDemo', PhysicsDemo);
  },
};
