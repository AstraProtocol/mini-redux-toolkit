import { compose, props, map } from 'ramda';
const R = { compose, props, map };
function fromModels(models) {
  return R.compose(R.fromPairs, R.map(R.props(['namespace', 'state'])))(models);
}
export default fromModels;
