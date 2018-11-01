import Vue from 'vue';
import SvgIcon from 'vue-svgicon';
import '~/<%= options.distPath %>';

Vue.use(SvgIcon, {
  tagName: '<%= options.tagName %>'
});