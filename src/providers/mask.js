import utils from '../utils/utils'
import svgProvider from './svg'
import logger from '../utils/logger'

export default {
  initAddMaskOnSelectedArtboards,
  addMask,
  removeMask,
  applyMask
}

/**
 * @name initAddMaskOnSelectedArtboards
 * @description main function to add mask on selected artboards
 * @param context {Object}
 * @param params {Object}
 * @param artboards {Array} : MSArtboardGroup
 */
function initAddMaskOnSelectedArtboards(context, params, artboards) {
  artboards.some(async function (artboard) {
    if (utils.isArtboardMasked(artboard.object)) removeMask(artboard.object)
    try{
      await addMask(context, artboard.object, params)
    }catch(e){
      logger.error(e)
    }
  })
  utils.clearSelection(context)
}

/**
 * @name removeMask
 * @description remove all mask from artboard
 * @param artboard {Object} : MSArtboardGroup
 */
function removeMask(artboard, unMaskOtherLayers) {
  const indexes = NSMutableIndexSet.indexSet()
  artboard.layers().forEach((layer, index) => {
    if (index % 2) {
      indexes.addIndex(index)
    } else if (unMaskOtherLayers) {
      layer.hasClippingMask = false;
      layer.clippingMaskMode = 1
    }
  })
  artboard.removeLayersAtIndexes(indexes)
}

/**
 * @name addMask
 * @description index function for all step to add mask and convert artboard to symbol at end
 * @param context {Object}
 * @param currentArtboard {Object} : MSArtboardGroup
 * @param params {Object}
 */
async function addMask(context, currentArtboard, params) {
  if (!utils.isArtboardMasked(currentArtboard)) {
      const svgData = utils.layerToSvg(currentArtboard.firstLayer())
      await svgProvider.replaceSVG(context, currentArtboard, svgData, true, false)
  }
  let mask
  if (params.color) {
    mask = getMaskSymbolFromLib(context, currentArtboard, params.color, params.colorLib)
  } else if (params.colorPicker) {
    mask = createMaskFromNean(context, currentArtboard, params.colorPicker)
  }
  applyMask(currentArtboard, mask, context)
}


/**
 * @name createMaskFromNean
 * @param context
 * @param currentArtboard
 * @param color
 * @return {Object} : MSShapeGroup
 */
function createMaskFromNean(context, currentArtboard, color) {
  const currentArtboardSize = currentArtboard.rect()

  const mask = MSShapeGroup.shapeWithRect({
    origin: {x: 0, y: 0},
    size: {width: currentArtboardSize.size.width, height: currentArtboardSize.size.height}
  })
  const fill = mask.style().addStylePartOfType(0);
  fill.color = color;

  return mask
}

/**
 * @name createMask
 * @description add mask from symbol master colors library to one artboard
 * @param context {Object}
 * @param currentArtboard {Object} : MSArtboardGroup
 * @param colorSymbolMaster {Object}
 * @param colorLibrary {Object} : MSAssetLibrary
 * @return symbol {Object} : MSSymbolInstance
 */
function getMaskSymbolFromLib(context, currentArtboard, colorSymbolMaster, colorLibrary) {
  utils.clearSelection(context)
  const librairiesController = AppController.sharedInstance().librariesController()

  const symbolMaster = (colorLibrary) ? librairiesController.importForeignSymbol_fromLibrary_intoDocument(colorSymbolMaster, colorLibrary, context.document.documentData()).symbolMaster() : colorSymbolMaster
  return symbolMaster.newSymbolInstance();
}

/**
 * @name applyMask
 * @param currentArtboard
 * @param mask
 */
function applyMask(currentArtboard, mask) {
  const currentArtboardSize = currentArtboard.rect()
  mask.setHeightRespectingProportions(currentArtboardSize.size.height)
  mask.setWidthRespectingProportions(currentArtboardSize.size.width)
  mask.setName('🎨 color')
  // TODO: a modifier vite !
  currentArtboard.addLayers([mask])
  const iconLayer = currentArtboard.firstLayer()
  mask.moveToLayer_beforeLayer(iconLayer, mask);
  iconLayer.hasClippingMask = true
  iconLayer.clippingMaskMode = 0
  //
  // const newContent = []
  // currentArtboard.layers().reverse().forEach((layer) => {
  //   newContent.push(mask.duplicate(), layer)
  // })
  // currentArtboard.removeAllLayers()
  // currentArtboard.addLayers(newContent.reverse())
  // newContent.forEach((layer, index) => {
  //   if (!(index % 2)) {
  //     layer.hasClippingMask = true;
  //     layer.clippingMaskMode = 0
  //   }
  // })
}