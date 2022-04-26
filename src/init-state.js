import * as R from 'ramda';
function fromModels(models) {
  return R.compose(R.fromPairs, R.map(R.props(['namespace', 'state'])))(models);
}
export default fromModels;
