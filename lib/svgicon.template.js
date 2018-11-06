import Vue from 'vue';
import * as SvgIcon from 'vue-svgicon';
import '~/<%= options.distPath %>';

Vue.use(SvgIcon, {
  tagName: '<%= options.tagName %>'
});